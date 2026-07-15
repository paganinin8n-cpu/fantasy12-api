#!/usr/bin/env sh
set -eu

echo "Starting Fantasy12 BullMQ worker..."

exec node dist/worker.js
