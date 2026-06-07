#!/bin/bash
set -euo pipefail

echo "▲ Setting up Vercel deployment for AI Founder OS..."

if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

vercel login
vercel link --project "ai-founder-os" 2>/dev/null || true

echo "Adding environment variables..."
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_POSTHOG_KEY production
vercel env add NEXT_PUBLIC_POSTHOG_HOST production

echo ""
echo "✅ Vercel configured!"
echo "Run: vercel --prod"
