#!/usr/bin/env bash
set -euo pipefail

# Node.js version check
bash scripts/check-node.sh || exit 1

# Build shared package first (required by api and web)
echo "Building shared package..."
pnpm --filter @context-sync/shared build

# Start API and Web in parallel (bypass turbo to avoid Vite process issues)
echo ""
echo "Starting dev servers..."
echo "  API  → http://localhost:3001"
echo "  Web  → http://localhost:5173"
echo ""

cleanup() {
  kill $API_PID $WEB_PID 2>/dev/null
  wait $API_PID $WEB_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

pnpm --filter @context-sync/api dev &
API_PID=$!

pnpm --filter @context-sync/web dev &
WEB_PID=$!

wait $API_PID $WEB_PID
