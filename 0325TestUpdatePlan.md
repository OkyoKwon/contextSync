# 0325 테스트 전면 검토 및 개선 계획

> 작성일: 2025-03-25
> 대상: UT (Vitest), E2E (Playwright), E2E Clean-Env

---

## 1. 현황 요약

| 구분                  | 파일 수 | 테스트 수 | 비고                    |
| --------------------- | ------- | --------- | ----------------------- |
| **API (Backend UT)**  | 34      | ~180      | Vitest, Node env        |
| **Web (Frontend UT)** | 60      | 312       | Vitest, JSDOM env       |
| **Shared (UT)**       | 11      | ~50       | Vitest, Node env        |
| **E2E (Standard)**    | 29      | 117       | Playwright, Chromium    |
| **E2E (Clean-Env)**   | 4       | 52        | Playwright, 별도 DB     |
| **E2E (Quickstart)**  | 1       | 3         | Playwright, 별도 config |
| **합계**              | **139** | **~714**  |                         |

### 커버리지 현황

| 패키지 | Lines   | Branches | Functions | Statements | 목표       |
| ------ | ------- | -------- | --------- | ---------- | ---------- |
| API    | 80%+    | 80%+     | 80%+      | 80%+       | 80% (달성) |
| Web    | **11%** | 74%      | 54%       | **11%**    | 80% (미달) |
| Shared | 80%+    | 80%+     | 80%+      | 80%+       | 80% (달성) |

> **Web 커버리지 11%**: Pages, Components (layout/feature), i18n 등이 전혀 테스트되지 않음

---

## 2. 주요 문제점 분석

### 2.1 CRITICAL — 프론트엔드 Hook 테스트: Mock만 검증

**영향 파일**: useQuery/useMutation 래퍼 hook 테스트 대부분

**증상**: API 모듈 전체를 `vi.mock`하여 React Query의 실제 동작이 아닌 mock 초기 상태만 검증

```typescript
// use-database-status.test.ts (17줄 전체)
vi.mock('../../api/setup.api', () => ({
  setupApi: { getStatus: vi.fn().mockResolvedValue({ success: true, data: null, error: null }) },
}));

it('starts loading on mount', () => {
  const { result } = renderHookWithProviders(() => useDatabaseStatus());
  expect(result.current.isLoading).toBe(true); // 첫 렌더에 항상 true — 의미 없음
});
```

**문제**:

- `setupApi` 전체를 mock하여 실제 API client → HTTP 호출 체인 검증 불가
- success/error/loading 상태 전환 미테스트
- React Query의 캐시, 재시도, invalidation 로직 미검증
- **hook 구현을 삭제해도 테스트 통과 가능**

**특히 심각한 파일들** (stub 수준 — useQuery 래퍼):

- `use-database-status.test.ts` — 17줄, 1개 테스트, loading 초기값만 확인
- `use-local-session-detail.test.ts` — 22줄, 2개 테스트, enabled/disabled만 확인
- `use-projects.test.ts` — 25줄, 1개 테스트, `list`가 호출되었는지만 확인
- `use-activity.test.ts` — 29줄, 2개 테스트, disabled 조건만 확인

**교차검수 보정 — 양호한 테스트 재분류**:

- `use-theme-sync.test.ts` — ~~stub~~ → **양호**. `document.documentElement.setAttribute('data-theme', 'dark')` 호출을 spy로 검증. hook이 useEffect + DOM 조작뿐이므로 테스트가 실제 동작을 커버함
- `use-locale-sync.test.ts` — ~~stub~~ → **양호**. 동일 패턴. `setAttribute('lang', 'en')` 검증으로 충분
- `use-api-key-guard.test.ts` — ~~stub~~ → **양호**. Zustand store 테스트(React Query 아님). 상태 전환 4가지 케이스를 직접 검증

---

### 2.2 CRITICAL — 프론트엔드 API 테스트: 호출 시그니처만 검증

**영향 파일**: `client.test.ts`를 제외한 12개 API 테스트

**증상**: `api` 객체(get/post/patch/delete)를 전부 mock하고 올바른 endpoint 문자열이 전달되었는지만 확인

```typescript
// quota.api.test.ts — 패턴이 모든 API 테스트에 동일
vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

it('fetchQuotaStatus calls GET /auth/me/quota', async () => {
  await fetchQuotaStatus();
  expect(api.get).toHaveBeenCalledWith('/auth/me/quota');
});
```

**문제**:

- 응답 데이터 파싱/변환 로직 미검증 (반환값은 항상 `{ success: true, data: null }`)
- 에러 핸들링 미검증
- **API 함수를 삭제해도 테스트 통과 가능** (mock이 import를 대체)

**교차검수 보정 — `client.test.ts`는 우수**:

- MSW(`msw/node`)를 올바르게 사용하여 HTTP 수준 mock
- Authorization 헤더 전송, Content-Type 설정, 401 token refresh, 에러 처리 등 **실제 client 동작 11가지** 검증
- 이 테스트가 다른 API 테스트의 **모범 패턴**

**핵심 인사이트**: MSW 인프라(`test/mocks/server.ts`, `test/mocks/handlers.ts`)가 **이미 존재**하지만 `client.test.ts`에서만 활용. 나머지 12개 API 테스트는 이 인프라를 무시하고 `vi.mock`을 사용 중.

---

### 2.3 HIGH — 백엔드 Service 테스트: 과도한 Mocking

**영향 파일**: `project.service.test.ts`, `session.service.test.ts`, `notification.service.test.ts` 등

**증상**: 서비스의 모든 의존성을 mock하여 테스트 코드의 절반이 mock 설정

```typescript
// project.service.test.ts — 8개의 vi.mock() + 16개의 타입 캐스트
vi.mock('../project.repository.js', ...);   // 8개 함수
vi.mock('../collaborator.repository.js', ...);  // 6개 함수
vi.mock('../permission.helper.js', ...);
vi.mock('../../activity/activity.service.js', ...);
vi.mock('../../../lib/join-code.js', ...);
vi.mock('../../auth/auth.service.js', ...);
vi.mock('../../../lib/user-sync.js', ...);
vi.mock('../../../lib/project-sync.js', ...);

// 이후 16개의 mock 타입 캐스트 (line 69-95)
const mockCreateProject = projectRepo.createProject as ReturnType<typeof vi.fn>;
// ... 15개 더
```

**교차검수 보정 — 원래 분석의 과대평가 수정**:

원래 분석은 "mock만 테스트하므로 가치 없다"고 했지만, 실제 코드를 확인하면:

- **비즈니스 로직 분기는 실제로 검증됨**: `ForbiddenError`(비소유자 삭제), `NotFoundError`(존재하지 않는 프로젝트), 소유자 중복 방지, remote sync 조건부 실행 등
- **27개 테스트 중 에러 케이스 10개+**: 권한 체크, 존재 확인 등 핵심 분기 커버
- `getProjects`의 Kysely chainable mock (`selectFrom → select → where → where → execute`)은 복잡하지만 실제 쿼리 구조를 검증

**실제 문제점** (수정된 평가):

1. **mock 설정 boilerplate가 과도** — 파일의 40%가 mock 선언 (line 1-96 / 503줄)
2. **서비스 간 통합 미검증** — `logActivity`가 호출되었는지만 확인, 실제 activity 기록 미검증
3. **리포지토리 파라미터 검증은 있지만 불완전** — `mockCreateProject`에 전달된 값은 확인하지만, 리포지토리가 그 값으로 무엇을 하는지는 미검증

---

### 2.4 HIGH — E2E Clean-Env `team-collaboration.spec.ts`: 테스트 격리 부재

**파일**: `e2e/tests/clean-env/team-collaboration.spec.ts` (844줄, 40개 테스트)

**증상**: CLEAN-013 → CLEAN-052까지 모듈 레벨 변수로 순차 의존

```typescript
let ownerToken: string; // CLEAN-013에서 할당
let projectId: string; // CLEAN-013에서 할당
let joinCode: string; // CLEAN-015에서 할당
let memberToken: string; // CLEAN-016에서 할당
// → 이후 모든 테스트가 이 값들에 의존
```

**교차검수 확인된 문제점**:

1. **`.catch(() => {})` 패턴** (line 178) — Join API 응답 대기 실패를 무시:

   ```typescript
   await page
     .waitForResponse((res) => res.url().includes('/projects/join') && res.status() === 200, {
       timeout: 10_000,
     })
     .catch(() => {
       // fallback: dialog may have already closed  ← 실패를 삼킴
     });
   await page.waitForTimeout(500); // brief settle  ← 하드코딩 대기
   ```

2. **`requireState()` 패턴** (line 17) — 선행 테스트 실패를 감지하지만 원인을 숨김:

   ```typescript
   function requireState<T>(name: string, value: T | undefined | null): asserts value is T {
     if (value === undefined || value === null || value === '')
       throw new Error(`Test prerequisite missing: ${name}. Earlier test may have failed.`);
   }
   ```

3. **텍스트 기반 selector** (다수) — UI 문구 변경에 취약:
   ```typescript
   page.locator('button:has-text("Remote Database")');
   page.locator('input[placeholder="postgresql://user:password@host:5432/dbname"]');
   page.locator('text=Join Project');
   ```

**교차검수 보정 — 구조적 한계 인정**:

- Clean-env 테스트는 **의도적으로 순차적** — "빈 DB에서 팀 전체 워크플로우"를 검증하는 것이 목적
- 파일 분리 시에도 **그룹 내 순차 의존은 불가피** (프로젝트 생성 → 멤버 초대 → 세션 공유)
- 따라서 "완전 격리"보다 **그룹 단위 격리 + fixture 기반 사전 조건**이 현실적

---

### 2.5 MEDIUM — E2E Assertion 부족

**영향 파일**: `plans.spec.ts`, `admin-dashboard.spec.ts`

```typescript
// plans.spec.ts — 매우 느슨한 검증
await expect(page.locator('body')).toContainText(
  /plan|no plan|empty|get started/i, // 4개 중 아무거나 매칭
);

// admin-dashboard.spec.ts — 다중 URL 매칭
expect(authenticatedPage.url()).toMatch(/admin|dashboard|settings/);
// → 비관리자가 /settings로 리다이렉트되는 것인지, /admin에 접근한 것인지 구분 불가
```

**교차검수 보정**:

- `admin-dashboard.spec.ts`의 URL regex는 **의도적일 가능성** — 비관리자 리다이렉트 동작 자체를 테스트
- 하지만 리다이렉트 대상을 정확히 검증하지 않으므로 regression 감지 불가
- `plans.spec.ts`의 `/plan|no plan|empty|get started/i`는 명확한 안티패턴

---

### 2.6 MEDIUM — 프론트엔드 커버리지 미달 영역

현재 **0% 커버리지**인 주요 영역:

- `src/pages/` — 전체 페이지 컴포넌트 (13개)
- `src/components/layout/` — 레이아웃 컴포넌트
- `src/components/` feature 컴포넌트 (projects, sessions, conflicts 등)
- `src/i18n/` — 국제화 로직
- `src/hooks/use-keyboard-shortcuts.ts` — 키보드 단축키
- `src/hooks/use-conversation.ts` — 대화 뷰어
- `src/lib/toast.ts` — 토스트 알림
- `src/lib/external-urls.ts` — 외부 URL 관리

---

### 2.7 LOW — 긍정적 사례 (유지/참고할 테스트)

잘 작성된 테스트 (실제 로직 검증, 적절한 edge case):

| 파일                                 | 이유                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| `client.test.ts` (Web API)           | **모범 사례** — MSW로 HTTP 수준 mock, 11개 실제 동작 검증 |
| `conflict-detector.test.ts`          | Pure function, mock 없이 실제 로직 검증                   |
| `claude-code-session.parser.test.ts` | 548줄, 복잡한 파싱 로직 철저히 검증                       |
| `title.utils.test.ts`                | 518줄, 다양한 엣지 케이스                                 |
| `auth.schema.test.ts`                | Zod validation 경계값 테스트                              |
| `client.test.ts` (DB)                | Pool/SSL 설정 로직 검증                                   |
| `env.test.ts`                        | 환경변수 파싱 격리 테스트 (`withEnv` helper)              |
| `local-session.auto-sync.test.ts`    | Chainable mock으로 Kysely 동작 시뮬레이션                 |
| `login.spec.ts` (E2E)                | 실제 유저 플로우 end-to-end 검증                          |
| `use-theme-sync.test.ts`             | DOM side-effect를 spy로 직접 검증                         |
| `use-api-key-guard.test.ts`          | Zustand store 상태 전환 4가지 케이스                      |

---

## 3. 교차검수 요약

### 원래 분석 대비 수정사항

| 항목                                | 원래 평가                  | 교차검수 결과                                           | 변경                            |
| ----------------------------------- | -------------------------- | ------------------------------------------------------- | ------------------------------- |
| `use-theme-sync.test.ts`            | stub, 가치 없음            | DOM side-effect 검증, 양호                              | 개선 대상에서 제외              |
| `use-locale-sync.test.ts`           | stub, 가치 없음            | DOM side-effect 검증, 양호                              | 개선 대상에서 제외              |
| `use-api-key-guard.test.ts`         | stub, 가치 없음            | Zustand store 테스트, 양호                              | 개선 대상에서 제외              |
| Backend service 테스트              | "mock만 테스트, 가치 없음" | 비즈니스 분기는 검증됨, **boilerplate가 문제**          | 심각도 하향 (CRITICAL→HIGH)     |
| MSW 도입                            | "신규 도입 필요"           | **이미 존재** (`test/mocks/server.ts`)                  | Phase 1 범위 축소 (확장만 필요) |
| E2E 파일 분리                       | "7개 파일로 완전 격리"     | 순차 의존 불가피, **그룹 단위 격리**가 현실적           | Phase 3 전략 수정               |
| `admin-dashboard.spec.ts` URL regex | 안티패턴                   | 비관리자 리다이렉트 의도, **하지만 정확한 대상 미검증** | 심각도 유지                     |

### 검증 통과 항목 (원래 분석 정확)

| 항목                                            | 검증 결과                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------- | ----- | -------------- |
| Hook 테스트 대부분이 mock 초기값만 검증         | **정확** — `use-database-status`, `use-projects`, `use-activity` 등 |
| API 테스트가 endpoint 문자열만 검증             | **정확** — 12개 파일 모두 동일 패턴 (`vi.mock('../client')`)        |
| `team-collaboration.spec.ts` `.catch(() => {})` | **정확** — line 178, 실패를 무시                                    |
| `plans.spec.ts` 느슨한 regex assertion          | **정확** — `/plan                                                   | no plan | empty | get started/i` |
| Web 커버리지 Lines 11%                          | **정확** — pages/components 0%                                      |

---

## 4. 개선 계획

### Phase 1: 프론트엔드 Hook/API 테스트를 MSW 기반으로 전환 (HIGH PRIORITY)

> 목표: `vi.mock` API 모듈 → MSW HTTP mock으로 전환, 상태 전환 검증 추가
> 전제: MSW 인프라 이미 존재 (`test/mocks/server.ts`, `client.test.ts` 참고)

#### 1-A. Hook 테스트 MSW 전환

**패턴 변경**:

```typescript
// Before — API 모듈 mock (현재)
vi.mock('../../api/setup.api', () => ({
  setupApi: { getStatus: vi.fn().mockResolvedValue({ success: true, data: null, error: null }) },
}));
it('starts loading on mount', () => {
  const { result } = renderHookWithProviders(() => useDatabaseStatus());
  expect(result.current.isLoading).toBe(true);
});

// After — MSW HTTP mock (개선)
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('returns database status after loading', async () => {
  server.use(
    http.get('/api/setup/status', () =>
      HttpResponse.json({
        success: true,
        data: { databaseMode: 'local', provider: 'local', host: 'localhost', remoteUrl: null },
        error: null,
      }),
    ),
  );
  const { result } = renderHookWithProviders(() => useDatabaseStatus());
  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data?.data?.databaseMode).toBe('local');
});

it('handles API error gracefully', async () => {
  server.use(
    http.get('/api/setup/status', () =>
      HttpResponse.json(
        { success: false, data: null, error: 'Connection failed' },
        { status: 500 },
      ),
    ),
  );
  const { result } = renderHookWithProviders(() => useDatabaseStatus());
  await waitFor(() => expect(result.current.isError).toBe(true));
});
```

**주의: `useAuthStore` mock 유지 필요**

hooks 중 `useAuthStore((s) => s.currentProjectId)`를 사용하는 것들은 store mock이 불가피:

```typescript
// 이 패턴은 유지 — store 의존성은 MSW로 대체 불가
vi.mock('../../stores/auth.store', () => ({
  useAuthStore: vi.fn((s: any) => s({ currentProjectId: 'proj-1' })),
}));
```

MSW는 **API 모듈 mock만 대체**. Store mock은 그대로 유지.

**대상 파일 및 추가할 케이스**:

| 파일                               | 현재 테스트 수 | 추가할 케이스                                             | 우선순위 |
| ---------------------------------- | -------------- | --------------------------------------------------------- | -------- |
| `use-sessions.test.ts`             | 9              | success 데이터 검증, error 처리, mutation 후 invalidation | P0       |
| `use-projects.test.ts`             | 1              | success/error 전환, 빈 목록, 데이터 구조 검증             | P0       |
| `use-conflicts.test.ts`            | 8              | error 처리, mutation (resolve) 후 invalidation            | P0       |
| `use-auth.test.ts`                 | 2              | login mutation, logout 시 쿼리 초기화                     | P0       |
| `use-database-status.test.ts`      | 1              | success/error 전환, 데이터 구조 검증                      | P1       |
| `use-local-session-detail.test.ts` | 2              | success 데이터, error, null sessionId                     | P1       |
| `use-activity.test.ts`             | 2              | success 데이터, disabled 조건 (현재 양호) 유지            | P1       |
| `use-prd-analysis.test.ts`         | 10             | MSW 전환 + error 케이스 추가                              | P1       |
| `use-ai-evaluation.test.ts`        | 7              | MSW 전환 + error 케이스 추가                              | P1       |
| `use-supabase-onboarding.test.ts`  | 6              | MSW 전환 + step 전환 검증                                 | P2       |
| `use-plans.test.ts`                | 4              | MSW 전환                                                  | P2       |
| `use-admin.test.ts`                | 3              | MSW 전환                                                  | P2       |
| `use-collaborators.test.ts`        | 3              | MSW 전환                                                  | P2       |

**제외 (이미 양호)**:

- `use-theme-sync.test.ts` — DOM side-effect 검증 충분
- `use-locale-sync.test.ts` — DOM side-effect 검증 충분
- `use-api-key-guard.test.ts` — Zustand store 테스트, 양호
- `use-permissions.test.ts` — pure logic 테스트
- `use-recent-searches.test.ts` — localStorage 상태 테스트
- `use-current-project-name.test.ts` — store selector 테스트
- `use-current-project.test.ts` — store selector 테스트
- `use-onboarding-status.test.ts` — 조건 분기 테스트

#### 1-B. API 테스트 MSW 전환

**패턴 변경**:

```typescript
// Before — client mock
vi.mock('../client', () => ({
  api: { get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }) },
}));
it('calls GET /auth/me/quota', async () => {
  await fetchQuotaStatus();
  expect(api.get).toHaveBeenCalledWith('/auth/me/quota');
});

// After — MSW (client.test.ts 패턴 따라감)
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('returns parsed quota data', async () => {
  server.use(
    http.get('/api/auth/me/quota', () =>
      HttpResponse.json({
        success: true,
        data: { used: 5, limit: 100, remaining: 95 },
        error: null,
      }),
    ),
  );
  const result = await fetchQuotaStatus();
  expect(result.data).toEqual({ used: 5, limit: 100, remaining: 95 });
});

it('throws on server error', async () => {
  server.use(
    http.get('/api/auth/me/quota', () =>
      HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
    ),
  );
  await expect(fetchQuotaStatus()).rejects.toThrow('Internal error');
});
```

**대상 파일** (12개 — `client.test.ts` 제외):

| 파일                              | 현재 테스트 수 | 추가할 케이스                      |
| --------------------------------- | -------------- | ---------------------------------- |
| `sessions.api.test.ts`            | 13             | 응답 파싱, FormData 업로드, error  |
| `projects.api.test.ts`            | 9              | 응답 파싱, CRUD error              |
| `auth.api.test.ts`                | 10             | 응답 파싱, 401 처리                |
| `prd-analysis.api.test.ts`        | 8              | 파일 업로드, 응답 파싱             |
| `conflicts.api.test.ts`           | 6              | 응답 파싱, error                   |
| `ai-evaluation.api.test.ts`       | 5              | 응답 파싱, error                   |
| `supabase-onboarding.api.test.ts` | 4              | 응답 파싱, error                   |
| `setup.api.test.ts`               | 3              | 응답 파싱, request body 구조       |
| `admin.api.test.ts`               | 3              | 응답 파싱, 403 처리                |
| `plans.api.test.ts`               | 3              | URL 인코딩 (이미 양호), error 추가 |
| `quota.api.test.ts`               | 2              | 응답 파싱, error                   |
| `search.api.test.ts`              | 2              | 응답 파싱, error                   |

---

### Phase 2: 백엔드 Service 테스트 Boilerplate 축소 (MEDIUM PRIORITY)

> 목표: mock 설정 코드 40% 감소, 비즈니스 로직 assertion 유지/강화

#### 2-A. Mock Helper 팩토리 도입

현재 각 테스트 파일이 독립적으로 mock을 선언. 공통 패턴을 helper로 추출:

```typescript
// apps/api/src/test-helpers/mock-repositories.ts (신규)
import { vi } from 'vitest';

export function createProjectRepoMock() {
  return {
    createProject: vi.fn(),
    findProjectsWithTeamInfo: vi.fn(),
    findProjectByIdWithTeamInfo: vi.fn(),
    findProjectById: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    findProjectByJoinCode: vi.fn(),
    updateJoinCode: vi.fn(),
  };
}

export function createCollabRepoMock() {
  return {
    findCollaboratorByProjectAndUser: vi.fn(),
    findCollaboratorsByProjectId: vi.fn(),
    addCollaborator: vi.fn(),
    removeCollaborator: vi.fn(),
    isCollaborator: vi.fn(),
    updateCollaboratorDirectory: vi.fn(),
  };
}

// Kysely chainable mock builder
export function createKyselyChainMock(resolvedValue: unknown = []) {
  const execute = vi.fn().mockResolvedValue(resolvedValue);
  const chain = {
    select: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute,
    executeTakeFirst: vi.fn().mockResolvedValue(resolvedValue),
  };
  return { selectFrom: vi.fn().mockReturnValue(chain), ...chain };
}
```

**대상 파일**:

| 파일                           | 현재 mock 선언               | helper 적용 후                |
| ------------------------------ | ---------------------------- | ----------------------------- |
| `project.service.test.ts`      | 8 vi.mock + 16 캐스트 (96줄) | ~20줄 (helper import + setup) |
| `session.service.test.ts`      | 5+ vi.mock                   | ~15줄                         |
| `notification.service.test.ts` | 4+ vi.mock                   | ~12줄                         |
| `plan.service.test.ts`         | 3+ vi.mock                   | ~10줄                         |

#### 2-B. 누락된 서비스 간 통합 검증 추가

```typescript
// project.service.test.ts — 현재 누락된 케이스
it('should log activity when project is created', async () => {
  mockCreateProject.mockResolvedValue(makeProject());
  await createProject(db, 'user-1', { name: 'New' } as any);
  // 현재: logActivity 호출 여부만 확인 (없음)
  // 추가: logActivity가 올바른 type과 data로 호출되었는지 확인
  expect(logActivity).toHaveBeenCalledWith(
    db,
    expect.objectContaining({
      type: 'project_created',
      projectId: 'proj-1',
      userId: 'user-1',
    }),
  );
});

it('should sync to remote when databaseMode is remote', async () => {
  // joinByCode의 remote sync 경로 — 현재는 호출 여부만 확인
  // 추가: sync 함수에 전달되는 파라미터의 정합성 검증
});
```

---

### Phase 3: E2E Clean-Env 리팩토링 (HIGH PRIORITY)

> 목표: 844줄 단일 파일 → 3-4개 그룹으로 분리, 안티패턴 제거

#### 3-A. 그룹 단위 분리 (완전 격리는 비현실적 → 기능 그룹 단위)

```
tests/clean-env/
  team-collaboration/
    01-setup-and-join.spec.ts        # CLEAN-013~017 (DB 설정, 연결, 팀 구성)
    02-sessions-and-conflicts.spec.ts # CLEAN-018~022 (세션, 충돌, 대시보드)
    03-remote-and-import.spec.ts     # CLEAN-023~037 (리모트 전환, 세션 임포트)
    04-local-sync-and-verify.spec.ts # CLEAN-038~052 (로컬 동기화, 대시보드 검증)
    shared-state.ts                  # 그룹 간 공유 상태 관리
```

**각 파일 200줄 이하 목표**

#### 3-B. Fixture 기반 사전 조건

그룹 간 의존 데이터는 fixture로 관리:

```typescript
// shared-state.ts — 그룹 간 공유 (파일 기반)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const STATE_FILE = '/tmp/e2e-clean-env-state.json';

interface SharedState {
  ownerToken: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberToken: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  projectId: string;
  joinCode: string;
}

export function saveState(state: Partial<SharedState>) {
  const current = loadState();
  writeFileSync(STATE_FILE, JSON.stringify({ ...current, ...state }));
}

export function loadState(): Partial<SharedState> {
  if (!existsSync(STATE_FILE)) return {};
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

export function requireState<K extends keyof SharedState>(key: K): SharedState[K] {
  const state = loadState();
  const value = state[key];
  if (!value) throw new Error(`Missing state: ${key}. Run earlier test group first.`);
  return value;
}
```

#### 3-C. 안티패턴 제거

| 안티패턴                         | 현재 코드                               | 수정                                                                                      |
| -------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.catch(() => {})` (line 178)    | `waitForResponse(...).catch(() => {})`  | `await expect(page.waitForResponse(...)).resolves.toBeTruthy()` 또는 API 직접 호출로 대체 |
| `waitForTimeout(500)` (line 181) | 하드코딩 대기                           | `waitForResponse` 또는 `page.waitForSelector`                                             |
| 텍스트 기반 selector             | `button:has-text("Remote Database")`    | `data-testid="remote-db-button"`                                                          |
| placeholder selector             | `input[placeholder="postgresql://..."]` | `data-testid="connection-url-input"`                                                      |

**data-testid 추가 대상 컴포넌트** (프론트엔드 변경 필요):

```typescript
// SettingsPage.tsx 또는 관련 컴포넌트
<button data-testid="remote-db-button">Remote Database</button>
<input data-testid="connection-url-input" placeholder="postgresql://..." />
<button data-testid="join-project-button" title="Join project" />
<input data-testid="join-code-input" placeholder="ABC123" />
<button data-testid="join-submit-button">Join</button>
```

---

### Phase 4: 프론트엔드 커버리지 확대 (MEDIUM PRIORITY)

> 목표: Web Lines 커버리지 11% → 40%+, Functions 54% → 75%+

#### 4-A. 페이지 컴포넌트 Smoke 테스트

MSW + `renderWithProviders`로 각 페이지의 기본 렌더링 + 데이터 로딩 검증:

| 페이지                | 줄수 | 테스트 방향                           | 우선순위 |
| --------------------- | ---- | ------------------------------------- | -------- |
| `ProjectPage.tsx`     | 420  | 세션 목록 렌더, 필터, 빈 상태         | P0       |
| `OnboardingPage.tsx`  | 196  | Step 전환, 입력 검증, 완료 리다이렉트 | P0       |
| `DashboardPage.tsx`   | 144  | 통계 카드 렌더, 타임라인              | P1       |
| `PrdAnalysisPage.tsx` | 159  | 문서 목록, 업로드 UI                  | P1       |
| `ConflictsPage.tsx`   | 113  | 충돌 목록, 빈 상태                    | P1       |
| `SettingsPage.tsx`    | 64   | 설정 폼 렌더                          | P2       |
| `PlansPage.tsx`       | 83   | 플랜 목록, 빈 상태                    | P2       |

#### 4-B. 누락된 훅/유틸 테스트

| 파일                        | 커버리지 | 테스트 방향                     |
| --------------------------- | -------- | ------------------------------- |
| `use-keyboard-shortcuts.ts` | 0%       | `fireEvent.keyDown` 시뮬레이션  |
| `use-conversation.ts`       | 0%       | 메시지 파싱, 렌더링 데이터 변환 |
| `use-quota.ts`              | 0%       | MSW 기반 할당량 데이터 검증     |
| `use-session-sync.ts`       | 0%       | 동기화 mutation + invalidation  |
| `toast.ts`                  | 0%       | toast 함수 호출 검증            |
| `external-urls.ts`          | 0%       | URL 생성 로직                   |

---

### Phase 5: E2E Assertion 강화 (LOW PRIORITY)

> 목표: 느슨한 assertion → 정확한 상태 검증

#### 5-A. 수정 대상

| 파일                      | 현재 assertion                         | 개선                                                            |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `plans.spec.ts`           | `/plan\|no plan\|empty\|get started/i` | `getByTestId('plans-empty-state')`                              |
| `admin-dashboard.spec.ts` | `/admin\|dashboard\|settings/`         | `expect(url).toContain('/settings')` (비관리자 리다이렉트 명시) |

#### 5-B. UI에 data-testid 체계적 추가

E2E에서 참조하는 모든 주요 요소에 `data-testid` 부여:

- 빈 상태: `data-testid="{feature}-empty-state"`
- 목록: `data-testid="{feature}-list"`
- 액션 버튼: `data-testid="{feature}-{action}-button"`
- 폼: `data-testid="{feature}-form"`

---

## 5. 구현 계획 (Implementation Roadmap)

### Step 1: MSW Handler 확장 + 테스트 인프라 정비

> Phase 1 사전작업. Hook/API 테스트 전환 전에 공통 인프라를 먼저 구축.

**작업 목록**:

1. **`apps/web/src/test/mocks/handlers.ts` 확장** — 현재 `/auth/refresh` 1개만 존재. 주요 API 엔드포인트 기본 핸들러 추가:
   - `GET /api/setup/status` → 기본 local DB 상태
   - `GET /api/projects` → 빈 프로젝트 목록
   - `GET /api/projects/:id/sessions` → 빈 세션 목록
   - `GET /api/projects/:id/conflicts` → 빈 충돌 목록
   - `POST /api/auth/identify` → 기본 유저
   - 각 핸들러는 `ApiResponse<T>` envelope 형식 준수

2. **`apps/web/src/test/test-utils.tsx` 확장** — MSW server lifecycle을 포함하는 helper 추가:

   ```typescript
   export function setupMswForTest() {
     beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
     afterEach(() => server.resetHandlers());
     afterAll(() => server.close());
   }
   ```

3. **`useAuthStore` mock helper** — hook 테스트에서 반복되는 store mock을 helper로:
   ```typescript
   export function mockAuthStore(overrides: { currentProjectId?: string | null } = {}) {
     vi.mocked(useAuthStore).mockImplementation((s: any) =>
       s({ currentProjectId: overrides.currentProjectId ?? 'test-project-1' }),
     );
   }
   ```

**산출물**: 변경 파일 2개 (`handlers.ts`, `test-utils.tsx`), 신규 없음

---

### Step 2: P0 Hook 테스트 MSW 전환 (4개)

> `use-sessions`, `use-projects`, `use-conflicts`, `use-auth`

**각 파일 작업 순서**:

1. `vi.mock('../../api/...')` 제거
2. MSW `server.use()` 로 HTTP handler 설정
3. 기존 테스트를 `await waitFor`로 상태 전환 검증으로 변환
4. success / error / empty 케이스 추가
5. mutation 테스트에서 `queryClient.invalidateQueries` 동작 검증

**파일별 예상 변경**:

| 파일                    | 현재 줄수 | 예상 줄수 | 테스트 수 변화 |
| ----------------------- | --------- | --------- | -------------- |
| `use-sessions.test.ts`  | 121       | ~200      | 9 → 15+        |
| `use-projects.test.ts`  | 25        | ~80       | 1 → 5+         |
| `use-conflicts.test.ts` | 87        | ~140      | 8 → 12+        |
| `use-auth.test.ts`      | 41        | ~90       | 2 → 5+         |

---

### Step 3: P0 API 테스트 MSW 전환 (4개)

> `sessions.api`, `projects.api`, `auth.api`, `conflicts.api`

**각 파일 작업 순서**:

1. `vi.mock('../client')` 제거
2. `client.test.ts` 패턴 복사: MSW server lifecycle + `useAuthStore` mock
3. 각 API 함수에 대해: 정상 응답 파싱, 에러 처리, request body 검증
4. FormData 업로드가 있는 함수는 `request.formData()` 검증

---

### Step 4: P1 Hook/API 테스트 전환 (9개)

> `use-database-status`, `use-local-session-detail`, `use-activity`, `use-prd-analysis`, `use-ai-evaluation`, `use-supabase-onboarding` + `prd-analysis.api`, `ai-evaluation.api`, `setup.api`

Step 2-3과 동일 패턴. Step 2에서 확립된 패턴을 적용.

---

### Step 5: P2 나머지 Hook/API 테스트 전환 (10개)

> `use-plans`, `use-admin`, `use-collaborators`, `use-search`, `use-join-project`, `use-onboarding-status` + `admin.api`, `plans.api`, `quota.api`, `search.api`, `supabase-onboarding.api`

---

### Step 6: Backend Mock Helper 팩토리 생성

> Phase 2 실행

1. `apps/api/src/test-helpers/mock-repositories.ts` 생성
2. `apps/api/src/test-helpers/mock-db.ts` 생성 (Kysely chainable mock)
3. `project.service.test.ts` 리팩토링 — mock 선언을 helper 호출로 교체
4. 나머지 service 테스트에 동일 적용
5. 누락된 assertion 추가 (logActivity 파라미터, sync 파라미터)

---

### Step 7: E2E team-collaboration 분리

> Phase 3 실행

1. `shared-state.ts` 생성 (파일 기반 상태 공유)
2. `team-collaboration.spec.ts` → 4개 파일로 분리
3. 각 파일 200줄 이하로 유지
4. `playwright.clean-env.config.ts` 업데이트 (새 파일 경로)
5. `.catch(() => {})` → 명시적 에러 처리
6. `waitForTimeout` → `waitForResponse`/`waitForSelector`

---

### Step 8: data-testid 추가 + E2E selector 업데이트

> Phase 3 + Phase 5 겸용

1. 프론트엔드 컴포넌트에 `data-testid` 추가 (Settings, Join Dialog, Plans 등)
2. E2E 테스트에서 텍스트 selector → `data-testid` selector로 전환
3. `plans.spec.ts`, `admin-dashboard.spec.ts` assertion 정밀화

---

### Step 9: 페이지 컴포넌트 Smoke 테스트 (P0)

> Phase 4 시작

1. `ProjectPage.test.tsx` — MSW + renderWithProviders, 세션 목록/빈 상태 검증
2. `OnboardingPage.test.tsx` — Step wizard 전환 검증
3. React Router mock 설정 (`MemoryRouter` wrapper 추가)

---

### Step 10: 나머지 커버리지 확대

> Phase 4 완료

1. P1 페이지 테스트 (Dashboard, PrdAnalysis, Conflicts)
2. 누락된 훅 테스트 (keyboard-shortcuts, conversation, quota, session-sync)
3. 누락된 유틸 테스트 (toast, external-urls)
4. `vitest.config.ts` threshold 업데이트

---

## 6. 커버리지 목표

### 단계별 커버리지 목표

| Step           | Web Lines | Web Functions | Web Branches | 비고                                          |
| -------------- | --------- | ------------- | ------------ | --------------------------------------------- |
| 현재           | 11%       | 54%           | 74%          |                                               |
| Step 1-5 완료  | 15%       | 65%           | 78%          | Hook/API 테스트 품질 개선 (Lines는 소폭 상승) |
| Step 6 완료    | 15%       | 65%           | 78%          | Backend 변경, Web 영향 없음                   |
| Step 7-8 완료  | 16%       | 66%           | 78%          | data-testid 추가로 소폭 상승                  |
| Step 9-10 완료 | **40%+**  | **75%+**      | **82%+**     | 페이지/컴포넌트 테스트 추가                   |

### vitest.config.ts 업데이트 계획

```typescript
// Step 5 완료 후 (Hook/API 전환)
thresholds: { branches: 76, functions: 62, lines: 14, statements: 14 }

// Step 10 완료 후 (최종)
thresholds: { branches: 82, functions: 75, lines: 40, statements: 40 }
```

---

## 7. 원칙

1. **테스트는 실제 버그를 잡아야 한다** — mock 셋업을 검증하는 테스트는 가치 없음
2. **외부 경계만 mock** — HTTP(MSW), DB(Kysely mock), 파일 I/O만 mock, 내부 로직은 실제 실행
3. **기존 인프라 활용** — MSW 서버가 이미 존재하므로 새로 도입하지 않고 확장
4. **테스트 격리** — 각 테스트는 가능한 독립 실행, 불가피한 순차 의존은 그룹 단위로 관리
5. **정확한 assertion** — "무언가 보인다"가 아닌 "올바른 값이 보인다"
6. **커버리지 ≠ 품질** — 높은 커버리지보다 의미 있는 assertion이 우선
7. **점진적 개선** — 한 번에 전체를 바꾸지 않고 P0 → P1 → P2 순서로 진행
