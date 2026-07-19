#!/usr/bin/env bash
# Run the local P0 static checks. Dynamic Compose verification follows once secrets and Docker are configured.
set -euo pipefail

pnpm --dir app/frontend run lint
pnpm --dir app/frontend run build
(
  cd app/backend
  uv run ruff check src tests
  uv run pytest
)
