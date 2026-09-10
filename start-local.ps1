$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name was not found. Install the required tool and reopen PowerShell."
    }
}

Require-Command "node"
Require-Command "npm"
Require-Command "docker"

$nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 20) {
    throw "Node.js 20 or newer is required. Current major version: $nodeMajor"
}

Write-Host "[1/7] Preparing environment..." -ForegroundColor Cyan
node scripts/prepare-local-env.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/7] Installing dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    if (Test-Path "package-lock.json") {
        npm ci
    } else {
        npm install
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "node_modules already exists; skipping install."
}

Write-Host "[3/7] Starting PostgreSQL..." -ForegroundColor Cyan
docker compose up -d --wait db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/7] Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/7] Synchronizing database schema..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[6/7] Synchronizing catalog data..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[7/7] Starting STK Motors..." -ForegroundColor Green
Write-Host "Site:  http://localhost:3000"
Write-Host "Panel: http://localhost:3000/panel"
Write-Host "Press Ctrl+C to stop the server."
npm run dev
