#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: $1 was not found. Install Node.js 20+ and try again." >&2
    exit 1
  fi
}

require_command node
require_command npm

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  echo "Error: Node.js 20 or newer is required. Current major version: $node_major" >&2
  exit 1
fi

echo "[1/6] Preparing environment..."
node scripts/prepare-local-env.mjs

echo "[2/6] Installing dependencies..."
if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
else
  echo "node_modules already exists; skipping install."
fi

echo "[3/6] Creating database directory..."
mkdir -p db

echo "[4/6] Generating Prisma client..."
npx prisma generate

echo "[5/6] Synchronizing database and local seed data..."
npm run db:push
npx --yes tsx@4.23.12 prisma/seed.ts

echo "[6/6] Starting STK Motors..."
echo "Site:  http://localhost:3000"
echo "Panel: http://localhost:3000/panel"
echo "Press Ctrl+C to stop the server."
npm run dev
