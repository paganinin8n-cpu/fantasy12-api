#!/usr/bin/env sh
set -eu

echo "Starting Fantasy12 API..."

if [ "${RUN_DB_MIGRATIONS:-false}" = "true" ]; then
  echo "RUN_DB_MIGRATIONS=true -> applying Prisma migrations"
  npx prisma migrate deploy
else
  echo "RUN_DB_MIGRATIONS=false -> skipping Prisma migrations on boot"
fi

exec node dist/index.js
