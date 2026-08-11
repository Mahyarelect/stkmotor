$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name was not found. Install Node.js 20+ and reopen PowerShell."
    }
}

Require-Command "node"
Require-Command "npm"

$nodeMajor = [int]((& node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 20) {
    throw "Node.js 20 or newer is required. Current major version: $nodeMajor"
}

Write-Host "[1/6] Preparing environment..." -ForegroundColor Cyan
node scripts/prepare-local-env.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/6] Installing dependencies..." -ForegroundColor Cyan
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

Write-Host "[3/6] Creating database directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force "db" | Out-Null

Write-Host "[4/6] Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[5/6] Synchronizing database and local seed data..." -ForegroundColor Cyan
npm run db:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx --yes tsx@4.23.12 prisma/seed.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[6/6] Starting STK Motors..." -ForegroundColor Green
Write-Host "Site:  http://localhost:3000"
Write-Host "Panel: http://localhost:3000/panel"
Write-Host "Press Ctrl+C to stop the server."
npm run dev
