param()

$ErrorActionPreference = "Stop"

Write-Host "🔐 Setting Railway environment variables..." -ForegroundColor Cyan

$vars = @(
  "NODE_ENV=production",
  "CLERK_SECRET_KEY=$env:CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET=$env:CLERK_WEBHOOK_SECRET",
  "ANTHROPIC_API_KEY=$env:ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET=$env:STRIPE_WEBHOOK_SECRET",
  "GITHUB_WEBHOOK_SECRET=$env:GITHUB_WEBHOOK_SECRET",
  "OPENAI_API_KEY=$env:OPENAI_API_KEY",
  "FRONTEND_URL=https://ai-founder-os.vercel.app",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$env:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL=https://ai-founder-os.vercel.app"
)

railway variables set $vars

Write-Host "✅ All Railway environment variables set" -ForegroundColor Green
Write-Host ""
Write-Host "Verify with: railway variables" -ForegroundColor Cyan
