#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/Backend/.env"
COMPOSE_FILES=(
  -f "$ROOT_DIR/docker-compose.yml"
  -f "$ROOT_DIR/docker-compose.prod.yml"
)

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker CLI not found." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not running." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found." >&2
  exit 1
fi

if ! grep -q '^MONGODB_URI=' "$ENV_FILE"; then
  echo "Error: MONGODB_URI is missing in $ENV_FILE." >&2
  exit 1
fi

DETACH=(-d)
if [[ "${1:-}" == "--attach" ]]; then
  DETACH=()
  shift
fi

docker compose "${COMPOSE_FILES[@]}" up --build "${DETACH[@]}" "$@"
