param()
$ErrorActionPreference = "Stop"

Write-Host "Setting up Railway services for AI Founder OS..." -ForegroundColor Cyan

if (-not (Get-Command "railway" -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
  npm install -g @railway/cli
}

railway login --no-browser

railway init --name "ai-founder-os" 2>$null
if ($?) { Write-Host "Project created" -ForegroundColor Green } else { Write-Host "Project already exists" }

Write-Host "Adding PostgreSQL..." -ForegroundColor Yellow
railway add --plugin postgresql 2>$null
if ($?) { Write-Host "PostgreSQL added" -ForegroundColor Green } else { Write-Host "PostgreSQL already added" }

Write-Host "Adding Redis..." -ForegroundColor Yellow
railway add --plugin redis 2>$null
if ($?) { Write-Host "Redis added" -ForegroundColor Green } else { Write-Host "Redis already added" }

Write-Host "Deploying API service..." -ForegroundColor Yellow
railway up --service api --source ./apps/api --dockerfile ./apps/api/Dockerfile --detach

Write-Host ""
Write-Host "Railway setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy DATABASE_URL from Railway dashboard"
Write-Host "  2. Run: scripts/railway-env.ps1"
Write-Host "  3. Run: scripts/migrate-prod.ps1"
