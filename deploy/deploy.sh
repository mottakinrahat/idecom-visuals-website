#!/usr/bin/env bash
# Deploy (or roll back to) an image tag:   ./deploy/deploy.sh <tag>
# Pulls the images, restarts the stack, waits for health checks and automatically
# rolls back to the previous tag if the new one does not become healthy.
set -euo pipefail
cd "$(dirname "$0")/.."

TAG="${1:?usage: deploy.sh <image-tag>   (e.g. a git SHA, or 'latest')}"
STATE=.deploy-state
mkdir -p "$STATE"
PREV="$(cat "$STATE/current" 2>/dev/null || true)"

dc() { IMAGE_TAG="$1" ./deploy/dc.sh "${@:2}"; }

healthy() { # $1 = service
  local id; id="$(IMAGE_TAG="$TAG" ./deploy/dc.sh ps -q "$1")"
  [ -n "$id" ] && [ "$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null)" = "healthy" ]
}

echo "==> Deploying tag: $TAG (previous: ${PREV:-none})"
dc "$TAG" pull backend frontend
dc "$TAG" up -d --remove-orphans

echo "==> Waiting for health checks (max 150s)…"
deadline=$((SECONDS + 150))
until healthy backend && healthy frontend; do
  if [ $SECONDS -ge $deadline ]; then
    echo "!! Not healthy in time. Recent logs:"
    dc "$TAG" logs --tail=40 backend frontend || true
    if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
      echo "==> Rolling back to $PREV"
      dc "$PREV" pull backend frontend || true
      dc "$PREV" up -d --remove-orphans
    fi
    exit 1
  fi
  sleep 5
done

[ -n "$PREV" ] && [ "$PREV" != "$TAG" ] && echo "$PREV" > "$STATE/previous"
echo "$TAG" > "$STATE/current"
docker image prune -f >/dev/null
echo "==> Done. Running tag: $TAG"
dc "$TAG" ps
