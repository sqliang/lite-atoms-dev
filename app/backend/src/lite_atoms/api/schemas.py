"""HTTP and SSE DTOs. These mirror versioned contracts rather than database rows."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=2000)


class ProjectResponse(BaseModel):
    id: UUID
    title: str
    original_prompt: str
    lifecycle_status: str
    stable_version_id: UUID | None = None
    latest_run_status: str | None = None


class CreateRunRequest(BaseModel):
    kind: Literal["initial", "update", "retry", "restore"]
    request_id: UUID
    instruction: str | None = Field(default=None, max_length=4000)


class ContractUpdateRequest(BaseModel):
    content: dict[str, Any]


class ContractResponse(BaseModel):
    id: UUID
    project_id: UUID
    version: int
    content_json: dict[str, Any]
    status: str


class RunResponse(BaseModel):
    id: UUID
    project_id: UUID
    kind: str
    status: str
    stage: str | None
    repair_attempts: int
    error_code: str | None = None
    error_message: str | None = None


class ProjectFileResponse(BaseModel):
    path: str
    content: str


class MessageResponse(BaseModel):
    id: UUID
    run_id: UUID | None = None
    role: str
    visible_content: str
    created_at: datetime


class BuildLogResponse(BaseModel):
    attempt_no: int
    status: str
    diagnostics: str | None = None


class SseEnvelope(BaseModel):
    schemaVersion: Literal[1] = 1
    runId: UUID
    sequence: int
    at: str
    payload: dict[str, Any]


class PreviewTicketResponse(BaseModel):
    bootstrap_url: str
    expires_at: str
