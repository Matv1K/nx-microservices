#!/bin/sh
set -e

# Ensure unbuffered output
export NODE_OPTIONS="--no-warnings"

echo "Generating Prisma Client for posts service..." >&2
npx prisma generate --schema=./apps/posts_microservice/src/prisma/schema.prisma

echo "Running database migrations for posts service..." >&2
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set" >&2
  exit 1
fi

MIGRATIONS_DIR="./apps/posts_microservice/src/prisma/migrations"
if [ -d "$MIGRATIONS_DIR" ] && [ "$(ls -A "$MIGRATIONS_DIR" 2>/dev/null)" ]; then
  echo "Applying Prisma migrations..." >&2
  cd apps/posts_microservice
  npx prisma migrate deploy
  cd ../..
else
  echo "No migrations found; pushing schema to database..." >&2
  cd apps/posts_microservice
  npx prisma db push --accept-data-loss
  cd ../..
fi

echo "Starting posts microservice with live reload..." >&2
exec npm run start:posts:watch
