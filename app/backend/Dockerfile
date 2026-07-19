FROM python:3.11-slim
# Dulwich creates real Git repositories in Python. The Docker SDK talks to the host socket
# mounted only in the trusted Worker container, so this image needs no system Git/Docker.
RUN pip install --no-cache-dir uv \
    && useradd --create-home --uid 10001 app
WORKDIR /app
COPY app/backend/pyproject.toml app/backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY app/backend/src ./src
# The Worker copies this fixed, reviewed template into every temporary worktree.
# It is platform-owned source, never agent-provided content.
COPY templates ./templates
USER app
ENV PATH="/app/.venv/bin:$PATH" PYTHONPATH=/app/src
