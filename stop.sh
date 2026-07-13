#!/usr/bin/env bash
# Para o container do Mirai Dashboard.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f docker-compose.yml ]; then
  echo "docker-compose.yml não encontrado em $SCRIPT_DIR" >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  docker compose down
else
  sudo docker compose down
fi
