#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: $1 was not found. Install the required tool and try again." >&2
    exit 1
  fi
}

require_command node
require_command npm
require_command docker

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  echo "Error: Node.js 20 or newer is required. Current major version: $node_major" >&2
  exit 1
fi

echo "[1/7] Preparing environment..."
node scripts/prepare-local-env.mjs

echo "[2/7] Installing dependencies..."
if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
else
  echo "node_modules already exists; skipping install."
fi

echo "[3/7] Starting PostgreSQL..."
docker compose up -d --wait db

echo "[4/7] Generating Prisma client..."
npx prisma generate

echo "[5/7] Synchronizing database schema..."
npm run db:push
echo "[6/7] Synchronizing catalog data..."
npm run db:seed

echo "[7/7] Starting STK Motors..."
echo "Site:  http://localhost:3000"
echo "Panel: http://localhost:3000/panel"
echo "Press Ctrl+C to stop the server."
npm run dev
