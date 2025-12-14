#!/bin/sh
set -e

# Ensure unbuffered output
export NODE_OPTIONS="--no-warnings"

echo "Generating Prisma Client..." >&2
cd apps/auth_microservice
npx prisma generate --schema=./db/schema.prisma

echo "Running database migrations..." >&2
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

MIGRATIONS_DIR="./db/migrations"
if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
  echo "Applying Prisma migrations..." >&2
  npx prisma migrate deploy
else
  echo "No migrations found; pushing schema to database..." >&2
  npx prisma db push --accept-data-loss
fi

cd ../..

echo "Starting auth microservice with live reload..." >&2
exec npm run start:auth:watch
