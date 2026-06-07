#!/bin/sh
set -e

echo "Waiting for database..."
node scripts/wait-for-db.js

echo "Running migrations..."
npm run migrate

echo "Starting API..."
exec "$@"
