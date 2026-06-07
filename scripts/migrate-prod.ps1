param()

$ErrorActionPreference = "Stop"

Write-Host "🗄️ Running production database migrations..." -ForegroundColor Cyan

if (-not $env:DATABASE_URL) {
  if (Get-Command "railway" -ErrorAction SilentlyContinue) {
    Write-Host "Fetching DATABASE_URL from Railway..." -ForegroundColor Yellow
    $env:DATABASE_URL = railway variables get DATABASE_URL
  } else {
    Write-Host "ERROR: DATABASE_URL not set and Railway CLI not found." -ForegroundColor Red
    Write-Host "Set DATABASE_URL manually or install Railway CLI." -ForegroundColor Red
    exit 1
  }
}

Push-Location 'packages\db'

Write-Host "Running Prisma migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if (-not $?) { Pop-Location; exit 1 }

Write-Host "Seeding database..." -ForegroundColor Yellow
npx prisma db seed
if (-not $?) { Pop-Location; exit 1 }

Pop-Location

Write-Host ""
Write-Host "✅ Production migrations complete!" -ForegroundColor Green
