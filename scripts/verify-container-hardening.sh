#!/usr/bin/env sh
set -eu

IMAGE="${1:?usage: verify-container-hardening.sh <image>}"

docker run --rm --entrypoint sh "$IMAGE" -c '
  set -eu
  test "$(id -u)" -ne 0
  test "$(node -p "process.versions.node.split(\".\")[0]")" = "22"
  test "$NODE_ENV" = "production"
  test -f dist/index.js
  test -f dist/worker.js
  test -f scripts/start-production.sh
  test -f prisma/schema.prisma
  test -x node_modules/.bin/prisma
  test ! -d node_modules/typescript
  test ! -d node_modules/ts-node-dev
  test ! -d node_modules/pino-pretty
  node -e "require(\"@prisma/client\"); require(\"prisma/package.json\")"
'

HEALTHCHECK="$(docker inspect --format '{{json .Config.Healthcheck.Test}}' "$IMAGE")"
case "$HEALTHCHECK" in
  *'/health'*) ;;
  *)
    echo "Container healthcheck does not target /health" >&2
    exit 1
    ;;
esac

echo "Container hardening verification passed for $IMAGE"
