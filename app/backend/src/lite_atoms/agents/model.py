"""Model adapter factory and cooperative-abort plumbing shared by all agent roles."""

from __future__ import annotations

import logging
import threading
from typing import Any, Callable

from langchain_openai import ChatOpenAI

from lite_atoms.settings import settings


logger = logging.getLogger(__name__)


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


def _start_abort_watcher(model: ChatOpenAI, should_abort: Callable[[], bool], finished: threading.Event, name: str) -> None:
    """Close the model's HTTP client once the owning Run is cancelled.

    The daemon thread polls the durable cancel flag; closing the client makes an
    in-flight request fail immediately instead of streaming to completion. Callers
    must set `finished` when the session ends so the watcher exits.
    """

    def _watch() -> None:
        while not finished.wait(1.0):
            if should_abort():
                try:
                    model.root_client.close()
                except Exception:
                    logger.debug("Model client already closed", exc_info=True)
                return

    threading.Thread(target=_watch, daemon=True, name=name).start()
