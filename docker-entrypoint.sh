#!/bin/sh
set -e

# Run database migrations if enabled (defaults to true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ] || [ "${RUN_MIGRATIONS:-true}" = "1" ]; then
  echo "[entrypoint] Running database migrations..."
  node scripts/migrate.mjs || echo "[entrypoint] Migration note: Ensure database is reachable."
fi

echo "[entrypoint] Starting RenderAdvisor application..."
exec "$@"
