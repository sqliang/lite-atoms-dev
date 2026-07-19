"""Deep Agents role adapters with explicit file and capability boundaries.

The agents reason over a Build Contract and source files, but all effectful platform
operations (validation, Docker, Git, artifact upload and database promotion) remain in
the Worker. This keeps a model mistake from becoming a stable product version.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any, Callable

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from lite_atoms.application import repository
from lite_atoms.settings import settings


logger = logging.getLogger(__name__)


WRITABLE_PREFIXES = ("src/", "public/")


class AgentOutputError(ValueError):
    """A model response was not usable at the typed product boundary."""


class AgentAborted(Exception):
    """The owning Run was cancelled; raised inside a tool to unwind the model session."""


def _model(json_mode: bool = False) -> ChatOpenAI:
    """Build the sole configurable OpenAI-compatible model adapter.

    `json_mode` asks the provider for protocol-level JSON output; providers that do
    not support it fail loudly, and callers fall back to plain text extraction.
    A bounded request timeout keeps a reasoning model's long thinking from blocking
    a Run forever; the SDK retries transient failures before surfacing them.
    """
    kwargs: dict[str, Any] = {
        "model": settings.model_name,
        "api_key": settings.model_api_key,
        "base_url": settings.model_base_url,
        "temperature": 0,
        "request_timeout": 180,
        "max_retries": 2,
    }
    if json_mode:
        kwargs["model_kwargs"] = {"response_format": {"type": "json_object"}}
    return ChatOpenAI(**kwargs)


def _extract_json(text: str) -> dict[str, Any]:
    """Accept a JSON object even if a provider wraps it in a fenced code block."""
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise AgentOutputError("Agent did not return a JSON object")
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError as error:
        raise AgentOutputError("Agent returned invalid JSON") from error


def plan_contract(prompt: str, max_attempts: int = 3, should_abort: Callable[[], bool] | None = None) -> dict[str, Any]:
    """Plan a Build Contract with a plain model call, not a Deep Agent.

    The Planner needs no tool capability, so it skips the Deep Agents harness (whose
    injected prompts diluted the JSON-only instruction for weaker models). Provider
    JSON mode enforces the envelope at protocol level; the shared product validation
    plus feedback retries remain the content-level guard.
    """
    instructions = """You are the Planner for Lite Atoms Dev. Return exactly one JSON object.
It must contain title, summary, features (1-12 strings), components (objects with name and responsibility),
nonGoals (strings), and acceptanceCriteria (strings). Do not emit markdown, code, or prose outside the JSON.
User request:\n""" + prompt
    model = _model(json_mode=True)
    finished = threading.Event()
    if should_abort:
        def _watch_abort() -> None:
            while not finished.wait(1.0):
                if should_abort():
                    try:
                        model.root_client.close()
                    except Exception:
                        logger.debug("Model client already closed", exc_info=True)
                    return

        threading.Thread(target=_watch_abort, daemon=True, name="planner-abort-watcher").start()
    try:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt},
        ]
        last_error: Exception | None = None
        for attempt in range(max_attempts):
            if should_abort and should_abort():
                raise AgentAborted()
            logger.info("Planner attempt %s/%s started", attempt + 1, max_attempts)
            try:
                result = model.invoke(messages)
            except Exception as error:
                if should_abort and should_abort():
                    raise AgentAborted() from error
                # A provider without JSON mode support falls back to plain text once.
                if attempt == 0 and "response_format" in str(error).lower():
                    logger.warning("Provider rejected JSON mode, falling back to plain output", exc_info=True)
                    model = _model(json_mode=False)
                    continue
                raise
            try:
                draft = _extract_json(str(result.content))
                repository.validate_contract(draft)
                logger.info("Planner attempt %s/%s produced a valid contract", attempt + 1, max_attempts)
                return draft
            except (AgentOutputError, ValueError) as error:
                last_error = error
                logger.warning("Planner attempt %s/%s rejected: %s", attempt + 1, max_attempts, error)
                messages = [
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": prompt},
                    {"role": "user", "content": f"Your previous JSON was rejected: {error}. Return a corrected JSON object only."},
                ]
        raise AgentOutputError(f"Planner could not produce a valid Build Contract: {last_error}")
    finally:
        finished.set()


def _safe_path(worktree: Path, requested: str) -> Path:
    """Resolve an agent path under the worktree; traversal outside the tree stays fatal."""
    relative = requested.lstrip("/")
    candidate = (worktree / relative).resolve()
    if worktree.resolve() not in candidate.parents and candidate != worktree.resolve():
        raise AgentOutputError("Path escapes temporary worktree")
    return candidate


def _file_tools(
    worktree: Path,
    on_file_written: Callable[[str, str], None] | None = None,
    should_abort: Callable[[], bool] | None = None,
):
    """Expose only bounded source read/list/write tools to Builder and Repair."""
    def _raise_if_aborted() -> None:
        # Cancellation is checked at every tool call: tool exceptions unwind the whole
        # model session, which is exactly how an owner-initiated stop should behave.
        if should_abort and should_abort():
            raise AgentAborted()

    @tool
    def read_source(path: str) -> str:
        """Read a UTF-8 source file from the temporary generated project."""
        _raise_if_aborted()
        return _safe_path(worktree, path).read_text(encoding="utf-8")[:30_000]

    @tool
    def list_sources() -> str:
        """List editable source files, excluding Git and dependencies."""
        _raise_if_aborted()
        return "\n".join(
            item.relative_to(worktree).as_posix()
            for item in worktree.rglob("*")
            if item.is_file() and ".git" not in item.parts and "node_modules" not in item.parts
        )[:20_000]

    @tool
    def write_source(path: str, content: str) -> str:
        """Create or replace an allowlisted source file (max 200 KB)."""
        _raise_if_aborted()
        # Allowlist violations are returned as guidance, not raised: the model can then
        # retry with an allowed path instead of the whole Run dying on one bad write.
        relative = path.lstrip("/")
        if not relative.startswith(WRITABLE_PREFIXES):
            return f"rejected: only {' and '.join(WRITABLE_PREFIXES)} paths are writable; retry with an allowed path"
        if len(content.encode("utf-8")) > 200_000:
            return "rejected: file exceeds the 200 KB platform limit; split it into smaller modules"
        target = _safe_path(worktree, path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        # Notify the platform after the file is durable so the workspace can stream it.
        if on_file_written:
            on_file_written(path, content)
        return f"wrote {path}"

    return [read_source, list_sources, write_source]


def generate_source(
    worktree: Path,
    contract: dict[str, Any],
    diagnostics: str | None = None,
    on_file_written: Callable[[str, str], None] | None = None,
    should_abort: Callable[[], bool] | None = None,
    instruction: str | None = None,
) -> str:
    """Run Builder or Repair with a capability-minimized Deep Agent.

    The returned text is an auditable summary only. All source mutation has to pass through
    the constrained tools above, and later deterministic validation decides promotion.
    `on_file_written` is invoked after each successful write so the workspace can stream
    generated files before promotion. `should_abort` is polled between tool calls; when it
    fires, AgentAborted unwinds the session and propagates to the Worker. `instruction`
    carries the owner's update request for incremental Runs.
    """
    from deepagents import create_deep_agent

    role = "Repair" if diagnostics else "Builder"
    repair_note = f"\nBuild diagnostics to repair:\n{diagnostics}" if diagnostics else ""
    system_prompt = f"""You are the {role} for Lite Atoms Dev. Work only through the provided
source tools. Never use shell, network, Git, delete, configuration files, or dependencies.
You may only create or modify files under src/ and public/; every other path is rejected.
Implement the approved Build Contract in the existing React TypeScript application. {repair_note}
Style every component with Tailwind CSS v4 utility classes in className; the template already
wires Tailwind through src/styles.css, so do not create additional CSS files or CSS imports.
When done, explain briefly which source files you changed."""
    model = _model()
    agent = create_deep_agent(model=model, tools=_file_tools(worktree, on_file_written, should_abort), subagents=[], system_prompt=system_prompt)
    finished = threading.Event()
    if should_abort:
        def _watch_abort() -> None:
            # Poll the durable cancel flag; once set, close the model's HTTP client so an
            # in-flight request fails immediately instead of streaming to completion.
            while not finished.wait(1.0):
                if should_abort():
                    try:
                        model.root_client.close()
                    except Exception:
                        logger.debug("Model client already closed", exc_info=True)
                    return

        threading.Thread(target=_watch_abort, daemon=True, name="agent-abort-watcher").start()
    try:
        payload: dict[str, Any] = {"contract": contract}
        if instruction:
            # Incremental Runs: the owner's instruction steers a minimal edit, the
            # approved Contract remains the product boundary.
            payload["instruction"] = instruction
            payload["note"] = (
                "Modify the existing source minimally to satisfy the instruction; "
                "keep unrelated features and files intact."
            )
        result = agent.invoke({"messages": [{"role": "user", "content": json.dumps(payload, ensure_ascii=False)}]})
        return str(result["messages"][-1].content)[:4_000]
    finally:
        finished.set()


def generate_project_title(prompt: str) -> str:
    """Best-effort semantic project title; the caller keeps the placeholder on failure.

    This deliberately uses the plain model adapter, not a Deep Agent: naming needs one
    bounded completion without any tool capability.
    """
    response = _model().invoke(
        "Generate a concise project name (at most 6 words, no quotes) for this app request. "
        "Reply with the name only.\n\n" + prompt
    )
    lines = str(response.content).strip().strip('"').splitlines()
    title = (lines[0].strip() if lines else "")[:60]
    if not title:
        raise AgentOutputError("Model returned an empty project title")
    return title
