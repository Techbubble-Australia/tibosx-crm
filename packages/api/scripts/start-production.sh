#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

cd /app/packages/database
npx prisma migrate deploy

cd /app
exec node packages/api/dist/index.js
