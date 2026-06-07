#!/bin/bash
set -euo pipefail

echo "🚂 Setting up Railway services for AI Founder OS..."

if ! command -v railway &> /dev/null; then
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
fi

railway login --no-browser

railway init --name "ai-founder-os" 2>/dev/null || echo "Project already exists"

echo "Adding PostgreSQL..."
railway add --plugin postgresql 2>/dev/null || echo "PostgreSQL already added"
echo "✅ PostgreSQL added"

echo "Adding Redis..."
railway add --plugin redis 2>/dev/null || echo "Redis already added"
echo "✅ Redis added"

echo "Deploying API service..."
railway up --service api \
  --source ./apps/api \
  --dockerfile ./apps/api/Dockerfile \
  --detach

echo ""
echo "✅ Railway setup complete!"
echo "📋 Next steps:"
echo "   1. Copy DATABASE_URL from Railway dashboard"
echo "   2. Run: bash scripts/railway.env.sh"
echo "   3. Run: bash scripts/migrate-prod.sh"
