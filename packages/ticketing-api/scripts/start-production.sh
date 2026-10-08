#!/bin/sh
set -e

if [ -z "$TICKETING_DATABASE_URL" ]; then
  echo "TICKETING_DATABASE_URL is required"
  exit 1
fi

cd /app/packages/ticketing-database
npx prisma migrate deploy

cd /app
exec node packages/ticketing-api/dist/index.js
