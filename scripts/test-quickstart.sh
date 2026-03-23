#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/OkyoKwon/contextSync.git"
WORK_DIR=$(mktemp -d)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== QuickStart E2E Test ==="
echo "Work dir: $WORK_DIR"
echo ""

# ── Cleanup ──────────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "=== Cleanup ==="
  # dev 서버 종료 (pnpm dev는 turbo를 실행하고 turbo가 자식 프로세스를 spawn)
  if [ -n "${DEV_PID:-}" ]; then
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
  # Docker postgres 정리
  if [ -d "$WORK_DIR/contextSync" ]; then
    (cd "$WORK_DIR/contextSync" && docker compose down -v 2>/dev/null || true)
  fi
  rm -rf "$WORK_DIR"
  echo "Cleaned up."
}
trap cleanup EXIT

# ── S-1: git clone ───────────────────────────────────────────────────────
echo "[S-1] git clone..."
git clone "$REPO_URL" "$WORK_DIR/contextSync"
cd "$WORK_DIR/contextSync"
echo "  ✓ Clone complete"

# ── S-2: corepack enable ────────────────────────────────────────────────
echo "[S-2] corepack enable..."
if command -v corepack &>/dev/null; then
  corepack enable
  echo "  ✓ Corepack enabled"
elif command -v pnpm &>/dev/null; then
  echo "  ⊘ corepack not found, but pnpm already available — skipping"
else
  echo "FAIL: Neither corepack nor pnpm found. Install Node.js 22+ and run: corepack enable"
  exit 1
fi

# ── S-3: pnpm install ───────────────────────────────────────────────────
echo "[S-3] pnpm install..."
pnpm install
[ -d node_modules ] || { echo "FAIL: node_modules not created"; exit 1; }
echo "  ✓ Dependencies installed"

# ── S-4: pnpm bootstrap ─────────────────────────────────────────────────
echo "[S-4] pnpm bootstrap..."
pnpm bootstrap
[ -f apps/api/.env ] || { echo "FAIL: .env not created"; exit 1; }
echo "  ✓ Bootstrap complete, .env exists"

# Docker postgres 확인
if ! docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
  echo "FAIL: PostgreSQL not ready"
  exit 1
fi
echo "  ✓ PostgreSQL is ready"

# ── S-5: pnpm dev (백그라운드) ───────────────────────────────────────────
echo "[S-5] pnpm dev (background)..."
pnpm dev &
DEV_PID=$!

# API 서버 대기 (최대 60초)
echo "  Waiting for API server..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "  ✓ API ready (http://localhost:3001)"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "FAIL: API server timeout (60s)"
    exit 1
  fi
  sleep 1
done

# Web 서버 대기 (최대 30초)
echo "  Waiting for Web server..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:5173 >/dev/null 2>&1; then
    echo "  ✓ Web ready (http://localhost:5173)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FAIL: Web server timeout (30s)"
    exit 1
  fi
  sleep 1
done

echo ""
echo "=== Phase 1 Complete — All servers running ==="
echo ""

# ── Phase 2: Playwright 테스트 ───────────────────────────────────────────
echo "[Phase 2] Running Playwright onboarding tests..."

# 원본 프로젝트 디렉토리에서 Playwright 실행 (버전 충돌 방지)
cd "$SCRIPT_DIR"

# Playwright 브라우저 확보
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

npx playwright test \
  --config=e2e/playwright.quickstart.config.ts \
  --reporter=list

echo ""
echo "=== QuickStart E2E Test PASSED ==="
