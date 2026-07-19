"""Builder and Repair roles: capability-minimized Deep Agents over the worktree.

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

from lite_atoms.agents.errors import AgentAborted, AgentOutputError
from lite_atoms.agents.model import _model, _start_abort_watcher


logger = logging.getLogger(__name__)

WRITABLE_PREFIXES = ("src/", "public/")

# Soft budget of generated source files: new files beyond this are nudged back with
# guidance so the model consolidates, instead of the Run dying at validation later.
SOURCE_FILE_BUDGET = 80


def _count_source_files(worktree: Path) -> int:
    """Count files under the writable prefixes (template + generated source only)."""
    return sum(
        1
        for prefix in WRITABLE_PREFIXES
        if (worktree / prefix).is_dir()
        for path in (worktree / prefix).rglob("*")
        if path.is_file()
    )


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
        target = _safe_path(worktree, path)
        # Soft file budget: rewrites are always allowed, but new files past the budget
        # get guidance to consolidate instead of a post-hoc validation failure.
        if not target.exists() and _count_source_files(worktree) >= SOURCE_FILE_BUDGET:
            return (
                f"rejected: the project already has {SOURCE_FILE_BUDGET} source files; "
                "merge this into an existing file instead of creating a new one"
            )
        if len(content.encode("utf-8")) > 200_000:
            return "rejected: file exceeds the 200 KB platform limit; split it into smaller modules"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        # Notify the platform after the file is durable so the workspace can stream it.
        if on_file_written:
            on_file_written(path, content)
        return f"wrote {path}"

    return [read_source, list_sources, write_source]


def _build_reference_excerpts(worktree: Path, references: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Resolve user-pinned references into bounded excerpts from the worktree.

    Missing or disallowed files are skipped silently: a stale reference must never
    fail the Run, and the allowlist keeps reads inside generated source.
    """
    excerpts: list[dict[str, Any]] = []
    for item in references[:5]:
        path = str(item.get("path", "")).lstrip("/")
        if not path.startswith(WRITABLE_PREFIXES):
            continue
        try:
            content = _safe_path(worktree, path).read_text(encoding="utf-8")
        except (AgentOutputError, OSError):
            continue
        lines = content.splitlines()
        start = item.get("start_line")
        end = item.get("end_line") or start
        if start:
            start = max(1, min(int(start), len(lines)))
            end = max(start, min(int(end or start), len(lines)))
            excerpt = "\n".join(f"{number}: {lines[number - 1]}" for number in range(start, end + 1))
        else:
            excerpt = content[:30_000]
        excerpts.append({"path": path, "start_line": start, "end_line": end, "excerpt": excerpt})
    return excerpts


def generate_source(
    worktree: Path,
    contract: dict[str, Any],
    diagnostics: str | None = None,
    on_file_written: Callable[[str, str], None] | None = None,
    should_abort: Callable[[], bool] | None = None,
    instruction: str | None = None,
    references: list[dict[str, Any]] | None = None,
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
Keep the total source file count under 60: co-locate related small components in the same
file instead of splitting every tiny piece into its own module.
Style every component with Tailwind CSS v4 utility classes in className; the template already
wires Tailwind through src/styles.css, so do not create additional CSS files or CSS imports.
When the input includes references, treat them as user-pinned code context and prioritize them.
When done, explain briefly which source files you changed."""
    model = _model()
    agent = create_deep_agent(model=model, tools=_file_tools(worktree, on_file_written, should_abort), subagents=[], system_prompt=system_prompt)
    finished = threading.Event()
    if should_abort:
        _start_abort_watcher(model, should_abort, finished, name="agent-abort-watcher")
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
        excerpts = _build_reference_excerpts(worktree, references or [])
        if excerpts:
            # User-pinned excerpts give the agent precise local context for the edit.
            payload["references"] = excerpts
        result = agent.invoke({"messages": [{"role": "user", "content": json.dumps(payload, ensure_ascii=False)}]})
        return str(result["messages"][-1].content)[:4_000]
    finally:
        finished.set()
