#!/bin/bash
set -euo pipefail

echo "🔐 Setting Railway environment variables..."

railway variables set \
  NODE_ENV=production \
  CLERK_SECRET_KEY="${CLERK_SECRET_KEY}" \
  CLERK_WEBHOOK_SECRET="${CLERK_WEBHOOK_SECRET}" \
  ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}" \
  STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}" \
  STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}" \
  GITHUB_WEBHOOK_SECRET="${GITHUB_WEBHOOK_SECRET}" \
  OPENAI_API_KEY="${OPENAI_API_KEY}" \
  FRONTEND_URL="https://ai-founder-os.vercel.app" \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \
  NEXT_PUBLIC_APP_URL="https://ai-founder-os.vercel.app"

echo "✅ All Railway environment variables set"
echo ""
echo "Verify with: railway variables"
