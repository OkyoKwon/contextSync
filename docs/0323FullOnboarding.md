# 0323 Full Onboarding E2E 기획

## 목적

**README QuickStart만 보고 따라하는 신규 유저의 전체 온보딩 경험을 E2E 테스트로 검증**하여, 테스트 실패를 통해 QuickStart 프로세스와 관련 코드의 문제를 발견하고 개선한다.

핵심 원칙:

- 테스트는 **실제 유저 행동을 그대로 재현**한다
- 테스트 통과를 위해 테스트를 억지로 수정하지 않는다
- **테스트 실패 = QuickStart 프로세스 또는 코드의 결함** → 프로세스/코드를 고친다

## 테스트 범위

### Phase 1: CLI 환경 셋업 (셸 스크립트)

README QuickStart에 기재된 그대로 실행:

```bash
git clone https://github.com/OkyoKwon/contextSync.git && cd contextSync
corepack enable
pnpm install
pnpm bootstrap
pnpm dev
```

**검증 포인트:**
| # | 단계 | 검증 | 실패 시 의미 |
|---|------|------|-------------|
| S-1 | `git clone` | exit code 0, contextSync 디렉토리 존재 | 레포 접근 불가 |
| S-2 | `corepack enable` | exit code 0 | Node.js 미설치 또는 버전 부적합 |
| S-3 | `pnpm install` | exit code 0, node_modules 생성 | lockfile 불일치, 패키지 문제 |
| S-4 | `pnpm bootstrap` | exit code 0, `.env` 생성, Docker postgres 실행 | setup.sh 버그, Docker 문제 |
| S-5 | `pnpm dev` | API health 응답(3001), Web 응답(5173) | turbo 설정, 빌드 에러, 포트 충돌 |

### Phase 2: 브라우저 온보딩 (Playwright)

서버가 준비된 후, 실제 브라우저에서 신규 유저 플로우 실행:

| #   | 단계           | 사용자 행동                                          | 검증                           |
| --- | -------------- | ---------------------------------------------------- | ------------------------------ |
| B-1 | 루트 접속      | `http://localhost:5173/` 열기                        | `/identify`로 리다이렉트       |
| B-2 | 이름 입력      | "Enter your name" 필드에 이름 입력                   | 입력 필드 visible, 타이핑 가능 |
| B-3 | Get Started    | "Get Started" 버튼 클릭                              | `/onboarding`으로 리다이렉트   |
| B-4 | 프로젝트 이름  | "My Project" 필드에 프로젝트명 입력                  | 입력 필드 visible              |
| B-5 | Create Project | "Create Project" 또는 "Next" → "Create Project" 클릭 | 온보딩 완료, 대시보드 도달     |
| B-6 | 대시보드 확인  | 생성한 프로젝트명이 화면에 표시                      | 프로젝트가 실제로 생성됨       |

## 테스트 아키텍처

```
scripts/test-quickstart.sh          ← 진입점 (pnpm test:quickstart)
├── Phase 1: CLI 셋업
│   ├── git clone (임시 디렉토리)
│   ├── corepack enable
│   ├── pnpm install
│   ├── pnpm bootstrap
│   └── pnpm dev (백그라운드)
├── 서버 준비 대기
│   ├── curl API health (최대 60초)
│   └── curl Web (최대 30초)
└── Phase 2: Playwright 테스트
    └── e2e/tests/quickstart/full-onboarding.spec.ts
        ├── QS-001: 루트 → identify 리다이렉트
        ├── QS-002: 이름 입력 → onboarding 리다이렉트
        └── QS-003: 전체 여정 (이름 → 프로젝트 → 대시보드)

e2e/playwright.quickstart.config.ts  ← Playwright 설정 (webServer 없음, 기존 서버 사용)
```

## 파일 구조

| 파일                                           | 용도                                  |
| ---------------------------------------------- | ------------------------------------- |
| `scripts/test-quickstart.sh`                   | 전체 파이프라인 실행 셸 스크립트      |
| `e2e/playwright.quickstart.config.ts`          | Playwright 설정 (localhost:5173 연결) |
| `e2e/tests/quickstart/full-onboarding.spec.ts` | 브라우저 온보딩 테스트                |
| `package.json`                                 | `"test:quickstart"` 스크립트 추가     |
| `docs/E2E_TC.md`                               | QS-001~003 테스트 케이스 문서         |
| `docs/0323FullOnboarding.md`                   | 이 기획 문서                          |

## 테스트 실패 시 대응 원칙

```
테스트 실패
   │
   ├─ README/문서 문제인가? → 문서 수정
   │   예: 누락된 단계, 잘못된 명령어, 인라인 주석 문제
   │
   ├─ 스크립트 문제인가? → setup.sh / turbo.json 등 수정
   │   예: Docker 에러, .env 미생성, 빌드 순서 문제
   │
   ├─ 프론트엔드 코드 문제인가? → 컴포넌트/라우팅 수정
   │   예: 리다이렉트 안 됨, 입력 필드 렌더링 안 됨
   │
   ├─ 백엔드 코드 문제인가? → API/서비스 수정
   │   예: identify API 에러, 프로젝트 생성 실패
   │
   └─ 테스트 자체 문제인가? → 테스트가 실제 유저 행동과 다른 경우만 수정
       예: 셀렉터가 실제 UI와 불일치 (UI가 맞고 테스트가 틀린 경우)
```

## 실행 방법

```bash
# 포트 3001, 5173, 5432가 비어있어야 함
# Docker Desktop이 실행 중이어야 함
pnpm test:quickstart
```

## 전제 조건

- Node.js 22+
- Docker Desktop 실행 중
- 포트 3001, 5173, 5432 미사용
- 네트워크 연결 (git clone)
- Playwright 브라우저 설치 (`npx playwright install chromium`)

## 과거 발견된 문제 사례

이 테스트가 있었다면 사전에 잡았을 문제들:

| 문제                               | 발견 단계       | 커밋      |
| ---------------------------------- | --------------- | --------- |
| `pnpm setup` → pnpm 내장 명령 충돌 | S-4 (bootstrap) | `7bcf5ae` |
| Docker POSTGRES_PASSWORD 변수 보간 | S-4 (bootstrap) | `7fbbfa5` |
| shared 패키지 빌드 누락            | S-5 (dev)       | `74c5064` |
| 인라인 주석으로 zsh 깨짐           | S-3~S-4         | `06203bf` |
| .env 미생성 (Docker 에러 시)       | S-4 (bootstrap) | `06203bf` |

---

## 구현 계획

### 1. `scripts/test-quickstart.sh`

```bash
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
corepack enable
echo "  ✓ Corepack enabled"

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

# Playwright는 원본 프로젝트의 e2e/ 디렉토리에서 실행
# (clone된 디렉토리에는 playwright가 설치되어 있지만, 브라우저가 없을 수 있음)
# npx playwright install chromium으로 브라우저 확보
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

npx playwright test \
  --config="$SCRIPT_DIR/e2e/playwright.quickstart.config.ts" \
  --reporter=list

echo ""
echo "=== QuickStart E2E Test PASSED ==="
```

**핵심 설계 결정:**

- `set -euo pipefail`: 어떤 단계든 실패하면 즉시 종료
- `trap cleanup EXIT`: 테스트 성공/실패 무관하게 Docker + 임시 디렉토리 정리
- 각 단계에 `[S-N]` 접두사로 어디서 실패했는지 즉시 파악 가능
- Playwright 설정은 **원본 프로젝트**(`$SCRIPT_DIR`)에서 가져옴 — clone 디렉토리에 의존하지 않음

### 2. `e2e/playwright.quickstart.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/quickstart',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer 없음 — test-quickstart.sh가 이미 서버를 실행 중
});
```

**핵심 설계 결정:**

- `webServer` 없음: 셸 스크립트가 서버 라이프사이클 관리
- `baseURL: 'http://localhost:5173'`: 실제 유저와 동일한 포트
- `workers: 1`, `fullyParallel: false`: 순차 실행 (온보딩은 상태 의존적)

### 3. `e2e/tests/quickstart/full-onboarding.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('QuickStart — Full Onboarding Journey', () => {
  test('QS-001: Root URL redirects to identify page', async ({ page }) => {
    // 유저 행동: 브라우저에서 http://localhost:5173/ 열기
    await page.goto('/');
    await page.waitForURL('**/identify', { timeout: 15_000 });

    // 검증: identify 페이지 도달
    expect(page.url()).toContain('/identify');

    // 검증: 이름 입력 필드와 Get Started 버튼이 보임
    await expect(page.locator('input[placeholder="Enter your name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('QS-002: New user enters name and reaches onboarding', async ({ page }) => {
    // 유저 행동: 루트 접속 → 리다이렉트 → 이름 입력 → Get Started
    await page.goto('/');
    await page.waitForURL('**/identify', { timeout: 15_000 });

    const userName = `QS User ${Date.now()}`;
    await page.fill('input[placeholder="Enter your name"]', userName);
    await page.click('button[type="submit"]');

    // 검증: 온보딩 페이지 도달
    await page.waitForURL('**/onboarding', { timeout: 15_000 });
    expect(page.url()).toContain('/onboarding');

    // 검증: 프로젝트 이름 입력 필드가 보임
    await expect(page.locator('input[placeholder="My Project"]')).toBeVisible({ timeout: 10_000 });
  });

  test('QS-003: Full journey — name, project, dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/identify', { timeout: 15_000 });

    // ── 이름 입력 ──
    const userName = `QS Full ${Date.now()}`;
    await page.fill('input[placeholder="Enter your name"]', userName);
    await page.click('button[type="submit"]');

    // ── 온보딩 ──
    await page.waitForURL('**/onboarding', { timeout: 15_000 });

    const projectName = `QS Project ${Date.now()}`;
    const projectInput = page.locator('input[placeholder="My Project"]');
    await projectInput.waitFor({ state: 'visible', timeout: 10_000 });
    await projectInput.fill(projectName);

    // Create Project (Step 1만 있거나 Step 1 → Step 2)
    const nextBtn = page.locator('button:has-text("Next")');
    const createBtn = page.locator('button:has-text("Create Project")');

    if (await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nextBtn.click();
      await createBtn.waitFor({ state: 'visible', timeout: 5_000 });
    }
    await createBtn.click();

    // ── 대시보드 도달 ──
    await page.waitForFunction(
      () =>
        !window.location.pathname.includes('/onboarding') &&
        !window.location.pathname.includes('/identify'),
      { timeout: 15_000 },
    );

    // 검증: 온보딩/identify가 아닌 페이지에 도달
    expect(page.url()).not.toContain('/onboarding');
    expect(page.url()).not.toContain('/identify');

    // 검증: 프로젝트명이 페이지 어딘가에 표시
    await expect(page.locator(`text=${projectName}`)).toBeVisible({
      timeout: 10_000,
    });
  });
});
```

**핵심 설계 결정:**

- 순수 `@playwright/test` import — 프로젝트 fixture 의존 없음 (실제 유저 관점)
- 셀렉터는 실제 UI의 placeholder/text 기반 (data-testid 아님)
- 각 테스트가 `/`(루트)에서 시작 — 유저가 브라우저를 여는 것과 동일
- QS-003은 QS-001 + QS-002를 포함하는 풀 플로우지만, 개별 테스트도 유지하여 실패 지점을 세분화

### 4. `package.json` 변경

```diff
  "scripts": {
+   "test:quickstart": "bash scripts/test-quickstart.sh",
    "bootstrap": "bash scripts/setup.sh --defaults",
```

### 5. `docs/E2E_TC.md` 변경

기존 문서 하단에 QuickStart 섹션 추가:

```markdown
## QuickStart — Full Onboarding (e2e/tests/quickstart/)

| TC ID  | 설명                                   | 파일                    |
| ------ | -------------------------------------- | ----------------------- |
| QS-001 | 루트 URL → /identify 리다이렉트        | full-onboarding.spec.ts |
| QS-002 | 이름 입력 → /onboarding 리다이렉트     | full-onboarding.spec.ts |
| QS-003 | 전체 여정 (이름 → 프로젝트 → 대시보드) | full-onboarding.spec.ts |
```

### 구현 순서

1. `scripts/test-quickstart.sh` 생성 + 실행 권한
2. `e2e/playwright.quickstart.config.ts` 생성
3. `e2e/tests/quickstart/full-onboarding.spec.ts` 생성
4. `package.json`에 `test:quickstart` 스크립트 추가
5. `docs/E2E_TC.md` 업데이트
6. 로컬에서 `pnpm test:quickstart` 실행하여 검증
7. 실패 시 → 프로세스/코드 수정 (테스트 수정 아님)
