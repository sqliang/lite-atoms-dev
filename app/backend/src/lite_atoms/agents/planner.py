"""Planner role: turns a user request into a validated Build Contract.

The Planner needs no tool capability, so it uses a plain model call rather than the
Deep Agents harness (whose injected prompts diluted the JSON-only instruction for
weaker models). Provider JSON mode enforces the envelope at protocol level; the
shared product validation plus feedback retries remain the content-level guard.
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Callable

from lite_atoms.agents.errors import AgentAborted, AgentOutputError
from lite_atoms.agents.model import _model, _start_abort_watcher
from lite_atoms.application import repository


logger = logging.getLogger(__name__)


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
    """Plan a Build Contract, retrying with validation feedback on unusable output."""
    instructions = """You are the Planner for Lite Atoms Dev. Return exactly one JSON object.
It must contain title, summary, features (1-12 strings), components (objects with name and responsibility),
nonGoals (strings), and acceptanceCriteria (strings). Do not emit markdown, code, or prose outside the JSON.
User request:\n""" + prompt
    model = _model(json_mode=True)
    finished = threading.Event()
    if should_abort:
        _start_abort_watcher(model, should_abort, finished, name="planner-abort-watcher")
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
