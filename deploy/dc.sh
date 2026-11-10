#!/usr/bin/env bash
# docker compose wrapper: loads .env.production and the currently deployed image tag.
#   ./deploy/dc.sh ps | logs -f backend | restart nginx | ...
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.production ] || { echo "Missing .env.production (copy deploy/env.production.example)"; exit 1; }
export IMAGE_TAG="${IMAGE_TAG:-$(cat .deploy-state/current 2>/dev/null || echo latest)}"

exec docker compose --env-file .env.production -f docker-compose.production.yml "$@"
