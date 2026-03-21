# E2E 테스트 기획서 — ContextSync

## 1. 현황 분석

### 1.1 현재 테스트 상태

| 영역          | 테스트 파일 수 | 커버리지 목표 | 상태                                                             |
| ------------- | -------------- | ------------- | ---------------------------------------------------------------- |
| Backend 유닛  | 9              | 80%           | 부분 구현 (auth, conflicts, sessions, ai-evaluation, config, db) |
| Frontend 유닛 | 0              | 0% (목표 80%) | 미구현                                                           |
| Integration   | 0              | —             | 미구현                                                           |
| E2E           | 0              | —             | **미구현 (프레임워크 미설치)**                                   |

### 1.2 E2E 테스트 대상 범위

- **API 모듈:** 12개 (auth, projects, sessions, conflicts, search, notifications, invitations, admin, prd-analysis, ai-evaluation, activity, plans)
- **Frontend 페이지:** 14개 (landing, login, onboarding, dashboard, project, session-detail, conflicts, prd-analysis, ai-evaluation, plans, admin, settings, docs, invitations)
- **Frontend 라우트:** 공개 6개 (`/`, `/login`, `/docs`, `/onboarding`, `/invitations/accept`, `/invitations/expired`) + 보호 10개 (pathless layout 래핑) + 리다이렉트 4개
- **인증 흐름:** Email/Name → JWT → Protected Routes (pathless layout route 패턴)
- **핵심 비즈니스 로직:** 세션 임포트/검색, 충돌 감지/해결, PRD 분석, AI 평가
- **UI 인터랙션:** Command Palette (⌘K), 키보드 내비게이션 (⌘1-5), 접이식 사이드바, 세션 필터/정렬, Skeleton 로딩, Lazy 로딩 (React.lazy + Suspense)

---

## 2. 프레임워크 선정

### 2.1 비교

| 기준          | Playwright                | Cypress               |
| ------------- | ------------------------- | --------------------- |
| 브라우저 지원 | Chromium, Firefox, WebKit | Chromium 계열 중심    |
| 속도          | 빠름 (병렬 실행 네이티브) | 상대적으로 느림       |
| API 테스트    | `request` context 내장    | `cy.request` (제한적) |
| React 19 호환 | 완전 호환                 | 호환                  |
| 모노레포 지원 | 우수 (project 설정)       | 보통                  |
| CI 통합       | GitHub Actions 공식 지원  | 별도 설정 필요        |
| 러닝 커브     | 중간                      | 낮음                  |

### 2.2 결정: **Playwright**

선정 이유:

- 병렬 실행으로 12개 모듈 테스트 시간 단축
- `request` context로 API 테스트와 UI 테스트를 하나의 프레임워크로 통합
- Vitest와 동일한 `expect` API로 팀 학습 비용 최소화
- GitHub Actions 공식 액션 제공 (`playwright-github-action`)

---

## 3. 아키텍처 설계

### 3.1 디렉토리 구조

```
e2e/
├── playwright.config.ts          # Playwright 설정
├── global-setup.ts               # 테스트 DB 초기화, 마이그레이션
├── global-teardown.ts            # 정리
├── fixtures/
│   ├── auth.fixture.ts           # 인증된 페이지 fixture
│   ├── db.fixture.ts             # 테스트 데이터 시드
│   └── api.fixture.ts            # API 클라이언트 fixture
├── helpers/
│   ├── test-data.ts              # 팩토리 함수 (user, project, session 등)
│   └── wait-for.ts               # 커스텀 대기 유틸
├── tests/
│   ├── landing/
│   │   └── landing.spec.ts
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── onboarding.spec.ts
│   ├── projects/
│   │   ├── project-crud.spec.ts
│   │   └── project-collaboration.spec.ts
│   ├── sessions/
│   │   ├── session-import.spec.ts
│   │   ├── session-list.spec.ts
│   │   └── session-detail.spec.ts
│   ├── conflicts/
│   │   ├── conflict-detection.spec.ts
│   │   └── conflict-resolution.spec.ts
│   ├── search/
│   │   └── full-text-search.spec.ts
│   ├── prd-analysis/
│   │   └── prd-analysis.spec.ts
│   ├── ai-evaluation/
│   │   └── ai-evaluation.spec.ts
│   ├── plans/
│   │   └── plans.spec.ts
│   ├── admin/
│   │   └── admin-dashboard.spec.ts
│   ├── navigation/
│   │   ├── keyboard-shortcuts.spec.ts
│   │   ├── command-palette.spec.ts
│   │   └── sidebar.spec.ts
│   ├── routing/
│   │   └── redirects.spec.ts
│   └── api/                       # API 전용 E2E (UI 없이)
│       ├── auth-api.spec.ts
│       ├── projects-api.spec.ts
│       ├── sessions-api.spec.ts
│       ├── conflicts-api.spec.ts
│       └── admin-api.spec.ts
└── page-objects/                  # Page Object Model
    ├── LandingPage.ts
    ├── LoginPage.ts
    ├── DashboardPage.ts
    ├── ProjectPage.ts
    ├── SessionDetailPage.ts
    ├── ConflictsPage.ts
    ├── AdminPage.ts
    └── CommandPalette.ts
```

### 3.2 테스트 DB 전략

```
docker-compose.yml 확장:
  postgres-test:
    image: postgres:16-alpine
    port: 5433
    environment:
      POSTGRES_DB: contextsync_test
```

- **격리:** 테스트 전용 PostgreSQL 인스턴스 (포트 5433)
- **초기화:** `global-setup.ts`에서 마이그레이션 19개 자동 실행
- **정리:** 각 테스트 suite 전에 `TRUNCATE CASCADE`로 데이터 리셋
- **시드:** fixture에서 필요한 데이터만 생성 (최소 데이터 원칙)

### 3.3 인증 Fixture

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  apiContext: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, request }, use) => {
    // 1. API로 로그인 → JWT 획득
    const res = await request.post('/api/auth/login', {
      data: { email: 'test@example.com', name: 'Test User' },
    });
    const { data } = await res.json();

    // 2. localStorage에 토큰 주입
    await page.addInitScript((token) => {
      localStorage.setItem(
        'context-sync-auth',
        JSON.stringify({
          state: {
            token,
            user: {
              /* ... */
            },
          },
          version: 0,
        }),
      );
    }, data.token);

    await use(page);
  },
});
```

---

## 4. 테스트 시나리오 설계

### 4.1 우선순위 기반 테스트 매트릭스

**P0 — 반드시 통과해야 배포 가능 (Critical Path)**

| #   | 시나리오                     | 유형   | 설명                                                                       |
| --- | ---------------------------- | ------ | -------------------------------------------------------------------------- |
| 1   | 랜딩 페이지 → 로그인 진입    | UI     | `/` 렌더링, CTA → `/login` 이동                                            |
| 2   | 로그인 → 온보딩 → 대시보드   | UI     | 신규 유저 전체 플로우                                                      |
| 3   | 기존 유저 로그인 → 대시보드  | UI     | 토큰 저장, 리다이렉트                                                      |
| 4   | 프로젝트 CRUD                | UI+API | 단일 스텝 모달에서 생성, 조회, 수정, 삭제                                  |
| 5   | 세션 임포트 (JSON/JSONL)     | UI+API | 파일 업로드 → 파싱 → 저장                                                  |
| 6   | 세션 목록 조회 + 상세 보기   | UI     | 필터/정렬, Skeleton 로딩, 메시지 렌더링                                    |
| 7   | 인증 가드 (비인증 접근 차단) | UI     | Protected Route 리다이렉트 (`/login`)                                      |
| 8   | 리다이렉트 경로 검증         | UI     | `/sessions` → `/project`, `/settings/team` → `/settings` 등 4개 리다이렉트 |
| 9   | API 응답 envelope 검증       | API    | 모든 엔드포인트 `{ success, data, error }` 형식                            |

**P1 — 주요 기능 (Core Features)**

| #   | 시나리오                  | 유형   | 설명                                                  |
| --- | ------------------------- | ------ | ----------------------------------------------------- |
| 10  | 충돌 감지                 | API    | 동일 파일 수정 세션 → 충돌 생성                       |
| 11  | 충돌 해결                 | UI+API | 충돌 목록 → 해결 처리 (Skeleton 로딩 포함)            |
| 12  | Command Palette 검색 (⌘K) | UI     | 오버레이 열기, 검색어 입력, 최근 검색 표시, 결과 선택 |
| 13  | 전문 검색                 | UI+API | 세션/메시지 full-text search                          |
| 14  | 키보드 내비게이션 (⌘1-5)  | UI     | 단축키로 페이지 이동 검증                             |
| 15  | 사이드바 접기/펼치기      | UI     | 접이식 모드 토글, 아이콘 전용 모드, 상태 유지         |
| 16  | 프로젝트 초대 + 수락      | UI+API | 초대 생성 → 링크 → 수락                               |
| 17  | 토큰 리프레시             | API    | 만료 근접 토큰 자동 갱신                              |

**P2 — 부가 기능 (Extended Features)**

| #   | 시나리오             | 유형   | 설명                                                                                                   |
| --- | -------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| 18  | PRD 분석             | UI+API | PRD 업로드 → AI 분석 (mock)                                                                            |
| 19  | AI 평가              | UI+API | 세션 평가 요청 → 결과 표시 (mock)                                                                      |
| 20  | 플랜 관리            | UI+API | 플랜 CRUD                                                                                              |
| 21  | 관리자 대시보드      | UI+API | DB 상태 (`/admin/status`), 마이그레이션 실행 (`/admin/migrations/run`), 팀 접속 설정 (`/admin/config`) |
| 22  | 설정 페이지          | UI     | 사용자 설정 변경                                                                                       |
| 23  | 활동 로그            | UI+API | 프로젝트 활동 내역 조회                                                                                |
| 24  | Lazy 로딩 + Suspense | UI     | 페이지 전환 시 fallback spinner 표시 → 컴포넌트 로드 완료                                              |

### 4.2 핵심 시나리오 상세 — 랜딩 → 로그인 → 온보딩 플로우

```
0. GET /
   → LandingPage 렌더링 (QuickStart, TechStack, Contributing 섹션)
   → CTA 버튼 클릭 → /login으로 이동
1. GET /login
   → 로그인 폼 렌더링 확인
2. 이름/이메일 입력 → 제출
   → POST /api/auth/login 호출
   → JWT 토큰 반환
   → localStorage에 토큰 저장
3. /onboarding으로 리다이렉트
   → 프로젝트 생성 폼 표시 (단일 스텝 모달)
4. 프로젝트명/디렉토리 입력 → 생성
   → POST /api/projects 호출
   → currentProjectId 설정
5. /dashboard로 리다이렉트
   → Skeleton 로딩 → 대시보드 렌더링
   → QuickActions, SetupCompletionBanner 표시
   → 프로젝트명 확인
```

### 4.3 핵심 시나리오 상세 — 세션 임포트 + 충돌 감지

```
1. 인증된 상태에서 /project 진입
2. 세션 임포트 버튼 클릭
3. JSON 파일 선택 → 업로드
   → POST /api/projects/:id/sessions/import
   → 세션 생성 확인
4. 동일 파일을 수정하는 두 번째 세션 임포트
5. /conflicts 페이지 이동
   → 충돌 목록에 새 충돌 표시
   → severity 레벨 확인
6. 충돌 상세 보기 → 해결 처리
   → PATCH /api/projects/:id/conflicts/:conflictId
   → 상태 변경 확인
```

---

## 5. 외부 서비스 Mock 전략

AI 관련 기능(PRD 분석, AI 평가)은 `ANTHROPIC_API_KEY`가 필요하므로 E2E에서 실제 호출하지 않는다.

| 서비스               | Mock 방식                    | 구현                          |
| -------------------- | ---------------------------- | ----------------------------- |
| Anthropic Claude API | Playwright `route.fulfill()` | API 응답 고정값 반환          |
| Slack Webhook        | 환경변수 미설정으로 스킵     | 서비스 레이어에서 조건부 실행 |
| Resend (이메일)      | 환경변수 미설정으로 스킵     | 서비스 레이어에서 조건부 실행 |

```typescript
// e2e/helpers/mock-external.ts
await page.route('**/api.anthropic.com/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      /* mock Claude response */
    }),
  });
});
```

---

## 6. CI/CD 통합

### 6.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: contextsync_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install
      - run: npx playwright install --with-deps chromium

      - name: Run migrations
        run: pnpm --filter @context-sync/api migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5433/contextsync_test

      - name: Start API server
        run: pnpm --filter @context-sync/api dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5433/contextsync_test
          JWT_SECRET: test-secret-for-ci
          PORT: 3001

      - name: Start Web server
        run: pnpm --filter @context-sync/web dev &

      - name: Wait for servers
        run: npx wait-on http://localhost:3001/api/auth/me http://localhost:5173 --timeout 30000

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:5173
          API_URL: http://localhost:3001

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

### 6.2 실행 명령어 (로컬)

```bash
# package.json scripts 추가
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug": "playwright test --debug"
```

---

## 7. 구현 로드맵

### Phase 1 — 인프라 구축 (1~2일)

- [ ] Playwright 설치 및 `playwright.config.ts` 작성
- [ ] 테스트 DB 설정 (docker-compose에 `postgres-test` 추가)
- [ ] `global-setup.ts` / `global-teardown.ts` 구현 (마이그레이션 + 정리)
- [ ] 인증 fixture 구현 (`authenticatedPage`)
- [ ] 테스트 데이터 팩토리 함수 작성
- [ ] Page Object 기본 클래스 설정
- [ ] `package.json` 스크립트 추가

### Phase 2 — P0 Critical Path (2~3일)

- [ ] `landing.spec.ts` — 랜딩 페이지 렌더링 + CTA → `/login` 이동
- [ ] `login.spec.ts` — 로그인/온보딩 전체 플로우
- [ ] `project-crud.spec.ts` — 프로젝트 CRUD (단일 스텝 모달)
- [ ] `session-import.spec.ts` — 세션 임포트 (JSON/JSONL)
- [ ] `session-list.spec.ts` — 세션 목록 (필터/정렬, Skeleton) + 상세 보기
- [ ] `redirects.spec.ts` — 리다이렉트 경로 4개 검증 (`/sessions` → `/project` 등)
- [ ] `auth-api.spec.ts` — 인증 API envelope 검증
- [ ] `projects-api.spec.ts` — 프로젝트 API envelope 검증
- [ ] 인증 가드 테스트 (비인증 리다이렉트)

### Phase 3 — P1 Core Features (3~4일)

- [ ] `conflict-detection.spec.ts` — 충돌 감지 E2E
- [ ] `conflict-resolution.spec.ts` — 충돌 해결 UI 플로우
- [ ] `command-palette.spec.ts` — ⌘K 검색 오버레이 (열기, 검색, 최근 검색, 결과 선택)
- [ ] `full-text-search.spec.ts` — 검색 기능
- [ ] `keyboard-shortcuts.spec.ts` — ⌘1-5 키보드 내비게이션
- [ ] `sidebar.spec.ts` — 접이식 사이드바 (토글, 아이콘 모드, Core/Analysis/System 그룹)
- [ ] `project-collaboration.spec.ts` — 초대 + 수락 플로우
- [ ] `sessions-api.spec.ts` — 세션 API 상세
- [ ] `conflicts-api.spec.ts` — 충돌 API 상세
- [ ] 토큰 리프레시 테스트

### Phase 4 — P2 Extended + CI (2~3일)

- [ ] `prd-analysis.spec.ts` — PRD 분석 (mock)
- [ ] `ai-evaluation.spec.ts` — AI 평가 (mock)
- [ ] `plans.spec.ts` — 플랜 관리
- [ ] `admin-dashboard.spec.ts` — 관리자 기능 (DB status, migrations/run, config 엔드포인트)
- [ ] `admin-api.spec.ts` — Admin API 전용 테스트
- [ ] Lazy 로딩 + Suspense fallback 검증
- [ ] GitHub Actions 워크플로우 설정
- [ ] Playwright HTML Report 아티팩트 업로드
- [ ] 리포트 및 커버리지 대시보드 연동

**총 예상 소요: 8~12일**

---

## 8. Playwright 설정 초안

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testMatch: /.*api\/.*\.spec\.ts/,
      use: {
        baseURL: process.env.API_URL ?? 'http://localhost:3001',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @context-sync/api dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          'postgresql://postgres:postgres@localhost:5433/contextsync_test',
      },
    },
    {
      command: 'pnpm --filter @context-sync/web dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## 9. 진행 가능성 평가

### 유리한 점

| 항목                | 설명                                      |
| ------------------- | ----------------------------------------- |
| 일관된 API envelope | `ok()`/`fail()` 패턴으로 응답 검증이 단순 |
| Zod 스키마 존재     | 테스트 데이터 생성 시 스키마 재사용 가능  |
| Docker Compose 존재 | 테스트 DB 추가가 용이                     |
| 모듈 4파일 구조     | 각 모듈이 독립적이어서 테스트 격리 쉬움   |
| 순수 함수 서비스    | `db` 인자 주입으로 테스트 DB 교체 간단    |
| localStorage 인증   | Playwright에서 토큰 주입이 쉬움           |

### 리스크 및 대응

| 리스크                    | 영향                                            | 대응                                                    |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| 프론트엔드 유닛 테스트 0% | E2E만으로 모든 UI 버그 감지 불가                | Phase 2와 병행하여 컴포넌트 테스트 점진 추가            |
| 외부 AI API 의존          | PRD/평가 기능 테스트 불안정                     | route mock으로 완전 격리                                |
| 파일 업로드 테스트 복잡도 | 세션 임포트 시 multipart 처리 필요              | Playwright `setInputFiles()` API 활용                   |
| 테스트 DB 상태 관리       | 병렬 실행 시 데이터 충돌 가능                   | 테스트별 고유 프로젝트/유저 생성으로 격리               |
| CI 실행 시간              | 전체 E2E 5분+ 예상                              | P0만 PR 게이트, P1/P2는 nightly                         |
| 키보드 단축키 OS 차이     | ⌘ (Mac) vs Ctrl (Windows/Linux)                 | Playwright `page.keyboard` + OS 분기 헬퍼               |
| Lazy 로딩 타이밍          | Suspense fallback이 빠르게 사라져 테스트 불안정 | `waitForLoadState('networkidle')` 또는 최종 컨텐츠 대기 |

### 결론

**E2E 테스트 구축은 충분히 실현 가능하다.** 프로젝트의 일관된 아키텍처(모듈 패턴, API envelope, Zod 스키마)가 테스트 작성을 크게 단순화한다. Docker Compose 기반 DB와 localStorage JWT 인증 방식도 Playwright와 자연스럽게 통합된다.

권장 접근: **Phase 1(인프라) → Phase 2(P0 Critical Path)를 먼저 완료**하고, 이후 Phase 3~4를 점진적으로 추가한다. P0 테스트만으로도 배포 안정성을 크게 높일 수 있다.
