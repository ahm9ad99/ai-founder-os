#!/bin/bash
set -euo pipefail

echo "🗄️ Running production database migrations..."

if [[ -z "${DATABASE_URL:-}" ]]; then
  if command -v railway &> /dev/null; then
    echo "Fetching DATABASE_URL from Railway..."
    export DATABASE_URL="$(railway variables get DATABASE_URL)"
  else
    echo "ERROR: DATABASE_URL not set and Railway CLI not found."
    echo "Set DATABASE_URL manually or install Railway CLI."
    exit 1
  fi
fi

cd packages/db

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo ""
echo "✅ Production migrations complete!"
