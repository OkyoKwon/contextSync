# 테스트 전략서

## 프로젝트 분석

- **언어/프레임워크**: TypeScript 5.7 (strict) / Fastify 5 + Kysely 0.27 (API), React 19 + Vite 6 (Web)
- **아키텍처**: pnpm 모노레포 (apps/api, apps/web, packages/shared) — 모놀리식 API + SPA
- **DB**: PostgreSQL 16 (Kysely query builder, pool max 20, full-text search)
- **현재 테스트 상태**:
  - API: 16.52% (목표 80%), 34개 테스트 파일 — service/schema 위주
  - Web: ~60개 테스트, lines 12% threshold — UI/hooks/stores/api 위주
  - Shared: 100%
  - E2E: Playwright 기반 ~30개 spec 파일 (Chromium only)
- **테스트 프레임워크**: Vitest 3 (globals, v8 coverage), Testing Library, Playwright
- **CI**: GitHub Actions — lint, typecheck, test:coverage, e2e-clean (별도 job)

### 핵심 리스크 영역

| 영역                                     | 리스크                   | 현재 커버리지              |
| ---------------------------------------- | ------------------------ | -------------------------- |
| 인증/인가 (auth)                         | 보안 침해, 무단 접근     | 7.9%                       |
| 세션 관리 (sessions)                     | 데이터 손실, 정합성      | service만 부분 커버        |
| 프로젝트 권한 (projects)                 | 권한 우회, 데이터 유출   | schema/service만 부분 커버 |
| AI 평가 (ai-evaluation)                  | API key 노출, 비용 폭주  | service만 부분 커버        |
| 로컬 세션 동기화 (local-sessions)        | 데이터 유실, 충돌        | sync/auto-sync 부분 커버   |
| 설정/온보딩 (setup, supabase-onboarding) | 초기화 실패              | 4.3%                       |
| DB 클라이언트/마이그레이션 (database)    | 연결 실패, 스키마 불일치 | 8%                         |

---

## 테스트 피라미드

| 계층        | 비율 | 현재                  | 목표 수량 | 실행 시간 목표 | 도구                    |
| ----------- | ---- | --------------------- | --------- | -------------- | ----------------------- |
| 단위 테스트 | 70%  | ~34 (API) + ~60 (Web) | ~300개    | < 30초         | Vitest 3                |
| 통합 테스트 | 20%  | 거의 없음             | ~80개     | < 2분          | Vitest + Fastify inject |
| E2E 테스트  | 10%  | ~30 spec              | ~40개     | < 5분          | Playwright (Chromium)   |

### 계층별 범위 정의

**단위 테스트** — 격리된 함수/모듈 로직 검증

- service.ts: 비즈니스 로직 (repository를 vi.mock으로 모킹)
- schema.ts: Zod 유효성 검증 (입력 경계값)
- helpers/utils: 순수 함수 (conflict-detector, token-usage, session-export 등)
- Web: hooks, stores, utils, UI 컴포넌트

**통합 테스트** — 모듈 간 연동 검증

- routes.ts: Fastify inject로 HTTP 요청 → 응답 검증 (실제 라우트 핸들러 + Zod + 서비스)
- repository.ts: 실제 DB 또는 테스트 DB 연동 쿼리 검증
- plugin: auth/cors/error-handler 플러그인 통합

**E2E 테스트** — 사용자 시나리오 검증

- 인증 플로우, 프로젝트 CRUD, 세션 관리, 검색, 충돌 감지
- 현재 E2E 범위 충분 — 신규 기능 추가 시에만 확장

---

## 테스트 도구 스택

| 용도            | 도구                          | 선정 근거                                                                 |
| --------------- | ----------------------------- | ------------------------------------------------------------------------- |
| 테스트 러너     | Vitest 3                      | 이미 사용 중, Vite 네이티브, 빠른 실행                                    |
| 모킹            | vi.mock / vi.fn               | Vitest 내장, 기존 패턴 일관성 유지                                        |
| HTTP 통합       | Fastify inject                | 서버 기동 없이 HTTP 수준 테스트, 기존 Fastify 앱 인스턴스 재사용          |
| DB 테스트       | Testcontainers 또는 테스트 DB | PostgreSQL 컨테이너 자동 관리 (권장), 또는 docker-compose.test.yml 재활용 |
| 커버리지        | v8 (Vitest built-in)          | 이미 설정됨, 라인/브랜치/함수/문장 커버리지                               |
| 컴포넌트 테스트 | Testing Library               | 이미 사용 중, React 19 지원                                               |
| E2E             | Playwright                    | 이미 사용 중, CI 통합 완료                                                |
| API 모킹 (Web)  | MSW 2                         | Web 테스트의 API 호출 모킹 (이미 전환 완료로 추정)                        |

---

## 테스트 범위 -- 리스크 기반 우선순위

### P0: 즉시 착수 (보안/데이터 정합성 -- 비즈니스 크리티컬)

| 대상 모듈                                   | 리스크                 | 테스트 유형 | 예상 케이스 수    | 비고                                             |
| ------------------------------------------- | ---------------------- | ----------- | ----------------- | ------------------------------------------------ |
| auth (routes + service)                     | 보안 침해, JWT 위변조  | 단위 + 통합 | 20~25개           | 로그인/토큰 발급/갱신/만료, 권한 검증            |
| projects (routes + repository + permission) | 권한 우회, 데이터 유출 | 단위 + 통합 | 25~30개           | CRUD, 협업자 초대/제거, Join Code, 권한 매트릭스 |
| sessions (routes + repository)              | 데이터 손실            | 단위 + 통합 | 30~35개           | CRUD, 임포트/익스포트, 토큰 사용량, 검색 벡터    |
| plugins/auth                                | 미들웨어 우회          | 통합        | 10~12개           | JWT 디코딩, 인증 실패 처리, 보호 라우트          |
| plugins/error-handler                       | 에러 정보 누출         | 단위        | 5~8개 (기존 보강) | AppError 변환, 민감 정보 마스킹                  |

### P1: 높은 우선순위 (핵심 기능)

| 대상 모듈                       | 리스크                   | 테스트 유형 | 예상 케이스 수 | 비고                                |
| ------------------------------- | ------------------------ | ----------- | -------------- | ----------------------------------- |
| conflicts (routes + repository) | 동시 편집 충돌 미감지    | 단위 + 통합 | 15~20개        | 충돌 감지/해결, AI 분석             |
| local-sessions (routes)         | 동기화 실패, 데이터 유실 | 단위 + 통합 | 15~20개        | 자동 동기화, 디스크 파싱, 중복 방지 |
| plans (routes)                  | 파일 시스템 오류         | 통합        | 10~12개        | CRUD, 프로젝트 매핑                 |
| notifications (routes)          | 알림 누락                | 통합        | 8~10개         | 알림 목록, 읽음 처리                |

### P2: 중간 우선순위 (부가 기능)

| 대상 모듈                           | 리스크                | 테스트 유형 | 예상 케이스 수 | 비고                                        |
| ----------------------------------- | --------------------- | ----------- | -------------- | ------------------------------------------- |
| ai-evaluation (routes + repository) | API 비용, 응답 오류   | 단위 + 통합 | 15~20개        | 평가 생성/조회, Claude 클라이언트 에러 처리 |
| prd-analysis (routes + repository)  | API 비용, 잘못된 분석 | 단위 + 통합 | 12~15개        | 분석 요청/결과, 코드베이스 스캔             |
| search (routes)                     | 검색 누락/오탈        | 통합        | 8~10개         | 전문 검색, 필터, 페이지네이션               |
| activity (routes + repository)      | 활동 로그 누락        | 단위 + 통합 | 8~10개         | 활동 기록, 조회                             |

### P3: 낮은 우선순위 (설정/관리)

| 대상 모듈                    | 리스크             | 테스트 유형 | 예상 케이스 수    | 비고                  |
| ---------------------------- | ------------------ | ----------- | ----------------- | --------------------- |
| admin (routes)               | 관리자 권한 남용   | 통합        | 8~10개            | 대시보드, 사용자 관리 |
| quota (routes + repository)  | 사용량 초과 미차단 | 단위 + 통합 | 8~10개            | 할당량 조회/검증      |
| setup (routes)               | 초기화 실패        | 통합        | 5~8개             | 팀 설정, DB 연결 검증 |
| supabase-onboarding (routes) | 온보딩 실패        | 통합        | 5~8개             | 온보딩 플로우         |
| database/client              | 연결 실패          | 단위        | 5~8개 (기존 보강) | 풀 관리, SSL          |
| config/env                   | 환경 변수 누락     | 단위        | 5~8개 (기존 보강) | Zod 검증 경계값       |

---

## API 모듈별 테스트 계획 상세

### 파일 유형별 테스트 전략

| 파일 유형     | 테스트 방식      | 모킹 수준                                        |
| ------------- | ---------------- | ------------------------------------------------ |
| schema.ts     | 순수 단위 테스트 | 모킹 불필요                                      |
| service.ts    | 단위 테스트      | repository를 vi.mock, 외부 서비스 vi.mock        |
| repository.ts | 통합 테스트      | 테스트 DB 연결 (Testcontainers 권장)             |
| routes.ts     | 통합 테스트      | Fastify inject, service를 vi.mock 또는 실제 호출 |
| helpers/utils | 순수 단위 테스트 | 모킹 불필요 (순수 함수)                          |

### 모듈별 신규 테스트 파일 목록

```
modules/auth/__tests__/
  auth.service.test.ts        (기존 — schema 테스트만 포함, service 로직 추가)
  auth.routes.test.ts         (신규)

modules/projects/__tests__/
  project.schema.test.ts      (기존)
  project.service.test.ts     (기존 — 보강)
  project.repository.test.ts  (신규)
  project.routes.test.ts      (신규)
  collaborator.repository.test.ts (신규)

modules/sessions/__tests__/
  session.schema.test.ts      (기존)
  session.service.test.ts     (기존 — 보강)
  session.repository.test.ts  (신규)
  session.routes.test.ts      (신규)
  session-import.service.test.ts (신규)
  session-export.service.test.ts (신규)
  token-usage.service.test.ts (신규)
  token-usage.repository.test.ts (신규)

modules/conflicts/__tests__/
  conflict-detector.test.ts   (기존)
  conflict.service.test.ts    (신규)
  conflict.repository.test.ts (신규)
  conflict.routes.test.ts     (신규)

modules/local-sessions/__tests__/
  local-session.service.test.ts   (기존)
  local-session.sync.test.ts      (기존)
  local-session.auto-sync.test.ts (기존)
  local-session.routes.test.ts    (신규)

modules/plans/__tests__/
  plan.service.test.ts        (기존)
  plan.routes.test.ts         (신규)

modules/notifications/__tests__/
  notification.service.test.ts (기존)
  notification.routes.test.ts  (신규)

modules/ai-evaluation/__tests__/
  ai-evaluation.service.test.ts (기존)
  claude-client.test.ts         (기존 — 보강)
  ai-evaluation.routes.test.ts  (신규)
  ai-evaluation.repository.test.ts (신규)

modules/prd-analysis/__tests__/
  prd-analysis.schema.test.ts   (기존)
  prd-analysis.service.test.ts  (신규)
  prd-analysis.routes.test.ts   (신규)
  prd-analysis.repository.test.ts (신규)

modules/search/__tests__/
  search.service.test.ts       (신규)
  search.routes.test.ts        (신규)

modules/activity/__tests__/
  activity.schema.test.ts      (기존)
  activity.service.test.ts     (기존)
  activity.routes.test.ts      (신규)
  activity.repository.test.ts  (신규)

modules/admin/__tests__/
  admin.service.test.ts        (기존)
  admin.routes.test.ts         (신규)

modules/quota/__tests__/
  quota.service.test.ts        (신규)
  quota.routes.test.ts         (신규)
  quota.repository.test.ts     (신규)

modules/setup/__tests__/
  setup.service.test.ts        (신규)
  setup.routes.test.ts         (신규)

modules/supabase-onboarding/__tests__/
  supabase-onboarding.service.test.ts (기존)
  supabase-onboarding.schema.test.ts  (기존)
  supabase-onboarding.routes.test.ts  (신규)

plugins/__tests__/
  error-handler.test.ts        (기존 — 보강)
  auth.plugin.test.ts          (신규)
  cors.plugin.test.ts          (신규)
  auto-sync.plugin.test.ts     (신규)
```

**예상 총 신규 테스트 파일: ~35개 / 보강 대상: ~8개**

---

## Web 테스트 계획

### 현재 상태

- UI 컴포넌트 (13개): Button, Avatar, Spinner, EmptyState 등 -- 커버 양호
- Hooks (20+개): use-auth, use-sessions, use-projects 등 -- React Query 훅 테스트 존재
- Stores (4개): auth, theme, ui, locale -- 커버 양호
- API 클라이언트 (13개): MSW 기반 모킹으로 전환 완료 추정
- **갭**: 페이지 컴포넌트, 레이아웃, 복합 기능 컴포넌트 테스트 부재

### 추가 필요 범위

| 우선순위 | 대상                                                      | 예상 수량 | 비고                          |
| -------- | --------------------------------------------------------- | --------- | ----------------------------- |
| P1       | 페이지 컴포넌트 (LoginPage, ProjectsPage, SessionsPage)   | 10~15개   | 라우팅 + 데이터 로딩 + 렌더링 |
| P1       | 레이아웃 (Sidebar, Header, AppLayout)                     | 5~8개     | 네비게이션, 반응형            |
| P2       | 기능 컴포넌트 (SessionList, ConflictPanel, SearchResults) | 10~15개   | 상태 관리 + 사용자 인터랙션   |
| P3       | 에러 경계, 로딩 상태, 빈 상태                             | 5~8개     | 엣지 케이스                   |

### Web 커버리지 임계값 로드맵

현재 thresholds (lines: 12%) → Phase별 상향:

- Phase 1: lines 25%, branches 78%, functions 65%
- Phase 2: lines 45%, branches 80%, functions 75%
- Phase 3: lines 60%, branches 80%, functions 80%

---

## 모킹 전략

### DB 모킹 (API 단위 테스트)

```
패턴: vi.mock('../*.repository.js')로 repository 계층 전체 모킹
이유: service 로직만 격리 검증, DB 의존성 제거
기존 패턴: session.service.test.ts에서 이미 사용 중 — 이를 표준으로 확립
```

- `const db = {} as any` — service 함수의 첫 인자로 전달 (repository가 모킹되므로 실제 사용 안 됨)
- `vi.fn()`으로 반환값 제어, `mockResolvedValue` / `mockRejectedValue` 사용
- `beforeEach(() => vi.clearAllMocks())` 필수

### DB 통합 테스트 (Repository 테스트)

**권장 방식: Testcontainers**

```
설치: @testcontainers/postgresql
장점: 테스트마다 깨끗한 DB, CI에서도 동일하게 동작
주의: 첫 실행 시 이미지 풀 시간, Docker 필수
```

대안: docker-compose.test.yml을 활용한 공유 테스트 DB

- 트랜잭션 래핑 후 롤백으로 격리
- CI에서는 서비스 컨테이너로 PostgreSQL 기동

### 외부 서비스 모킹 (Anthropic API)

```
대상: ai-evaluation/claude-client.ts, prd-analysis/claude-client.ts
방식: vi.mock으로 모듈 레벨 모킹
원칙: 실제 API 호출 절대 금지 (비용 + 비결정성)
```

- 성공/실패/타임아웃/rate-limit 시나리오 각각 테스트
- fixture 파일로 응답 데이터 관리 (예: `__fixtures__/claude-response.json`)

### Fastify Inject (Routes 통합 테스트)

```
패턴: app.inject({ method, url, payload, headers })
장점: HTTP 서버 기동 없이 전체 미들웨어 체인 실행
설정: 테스트 전용 Fastify 인스턴스를 buildApp() 함수로 생성
```

- 인증이 필요한 라우트: 테스트용 JWT 토큰 생성 헬퍼 사용
- service를 모킹하여 라우트 로직만 검증 (또는 실제 service + 모킹된 repository)

### Web 모킹

```
API 호출: MSW 2 (이미 도입됨으로 추정)
라우터: MemoryRouter 래핑
스토어: Zustand 초기 상태 주입 또는 실제 스토어 사용
```

---

## CI 통합 설계

### 현재 파이프라인

```yaml
# .github/workflows/ci.yml (현재)
jobs:
  quality: # lint → typecheck → test:coverage (순차)
  e2e-clean: # E2E 클린 환경 테스트 (별도 job)
```

### 권장 파이프라인 구조

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Phase 1: 빠른 피드백 (병렬)
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup, pnpm install, pnpm lint]

  typecheck:
    runs-on: ubuntu-latest
    steps: [checkout, setup, pnpm install, build shared, pnpm typecheck]

  # Phase 2: 단위 테스트 (병렬, 가장 빠른 피드백)
  test-unit:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [api, web, shared]
    steps:
      - checkout, setup, pnpm install, build shared
      - pnpm --filter @context-sync/${{ matrix.package }} test:coverage
      - Upload coverage artifact

  # Phase 3: 통합 테스트 (DB 필요)
  test-integration:
    runs-on: ubuntu-latest
    needs: [test-unit]
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: contextsync_test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready
    steps:
      - checkout, setup, pnpm install, build shared
      - pnpm --filter @context-sync/api test:integration
      - Upload coverage artifact

  # Phase 4: E2E (가장 느림, 단위+통합 통과 후)
  e2e-clean:
    needs: [test-integration]
    # ... (현재 설정 유지)

  # Phase 5: 커버리지 종합 및 품질 게이트
  coverage-gate:
    needs: [test-unit, test-integration]
    steps:
      - Download coverage artifacts
      - Merge coverage reports
      - Check thresholds (fail if below gate)
      - Post coverage comment to PR
```

### 병렬 실행 전략

- lint와 typecheck는 독립적 — 병렬 실행
- 단위 테스트는 package별 matrix로 병렬 실행 (api, web, shared)
- 통합 테스트는 단위 테스트 통과 후 실행 (DB 서비스 비용 절감)
- E2E는 통합 테스트 통과 후 실행 (가장 비싼 리소스)

### 캐싱 전략

```yaml
# pnpm store 캐싱 (이미 actions/setup-node cache: pnpm으로 설정됨)
# 추가 권장:
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('pnpm-lock.yaml') }}

- name: Cache Vitest
  uses: actions/cache@v4
  with:
    path: node_modules/.vitest
    key: vitest-${{ hashFiles('pnpm-lock.yaml') }}
```

### 아티팩트 관리

- 커버리지 리포트: `actions/upload-artifact`로 업로드, 종합 job에서 다운로드 후 머지
- E2E trace/screenshot: 실패 시에만 업로드 (trace: 'on-first-retry' 이미 설정됨)
- 보존 기간: 7일 (기본값 유지)

---

## 품질 게이트

| 게이트           | 기준                    | 실패 시 액션            |
| ---------------- | ----------------------- | ----------------------- |
| 라인 커버리지    | 80% (최종 목표)         | PR 머지 차단            |
| 브랜치 커버리지  | 70% (최종 목표)         | PR 머지 차단            |
| 함수 커버리지    | 80% (최종 목표)         | PR 머지 차단            |
| 단위 테스트 시간 | < 30초                  | 경고 + 슬로 테스트 식별 |
| 통합 테스트 시간 | < 2분                   | 경고                    |
| E2E 테스트 시간  | < 5분                   | 경고                    |
| Flaky 테스트     | 재실행 2회 이상 통과 시 | flaky 태그 + 격리 추적  |
| 새 코드 커버리지 | 변경 파일 80%+          | PR 코멘트 경고          |

### 단계별 임계값 (API vitest.config.ts)

| Phase   | 시기    | lines       | branches    | functions   | statements  |
| ------- | ------- | ----------- | ----------- | ----------- | ----------- |
| 현재    | -       | 80 (미달성) | 80 (미달성) | 80 (미달성) | 80 (미달성) |
| Phase 1 | 0~30일  | 40          | 35          | 40          | 40          |
| Phase 2 | 30~60일 | 60          | 55          | 60          | 60          |
| Phase 3 | 60~90일 | 80          | 70          | 80          | 80          |

> 참고: 현재 vitest.config.ts에 80% threshold가 설정되어 있으나 실제 커버리지(16.52%)와 괴리가 큼.
> `pnpm test:coverage`가 threshold 체크 없이 실행되고 있을 가능성 있음 — 확인 필요.
> Phase 1 시작 시 threshold를 현실적 수준(40%)으로 낮추고 점진적으로 올릴 것을 권장.

---

## Flaky Test 방지 가이드라인

### 원칙

1. **결정적 데이터 사용**: `Date.now()`, `Math.random()`, UUID 등을 테스트에서 직접 사용하지 않음. `vi.useFakeTimers()` 또는 고정 seed 값 사용.
2. **테스트 격리**: 각 테스트는 독립적. 공유 상태(DB, 파일 시스템, 환경 변수) 사용 시 `beforeEach`에서 초기화, `afterEach`에서 정리.
3. **비동기 대기**: `setTimeout` 기반 폴링 금지. `waitFor`, `findBy*` 등 프레임워크 제공 유틸리티 사용.
4. **네트워크 의존성 제거**: 외부 API 호출은 반드시 모킹. 타임아웃 테스트는 `vi.advanceTimersByTime()` 사용.
5. **순서 독립성**: 테스트 실행 순서에 의존하지 않음. `vitest --shuffle` 옵션으로 주기적 검증.

### 기존 패턴 준수 사항

- `beforeEach(() => vi.clearAllMocks())` — 모든 테스트 파일에 필수
- `afterEach(() => localStorageMock.clear())` — Web 테스트 setup.ts에서 이미 처리됨
- vi.mock은 파일 최상위에서 호출 (hoisting 보장)

### Flaky 감지 및 대응

- CI에서 `--reporter=verbose` 사용하여 느린 테스트 식별
- 3회 연속 실패 후 성공하는 테스트 → `flaky` 태그 부여 → 별도 이슈 트래킹
- E2E: `retries: isCI ? 1 : 0` (이미 설정됨) — retry 횟수 2 이상이면 flaky로 분류

---

## 단위 테스터 전달 사항

### 테스트 범위

- **최우선**: auth.service, project.service, session.service의 누락된 비즈니스 로직 케이스
- **다음**: routes 핸들러 로직은 통합 테스트로 분류하되, 순수 로직 추출 가능한 부분은 단위 테스트
- **Web**: 페이지 컴포넌트, 레이아웃 컴포넌트 추가

### 모킹 전략 (단위 테스트용)

```typescript
// 표준 패턴: repository 모킹
vi.mock('../feature.repository.js', () => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

// 의존 서비스 모킹
vi.mock('../../projects/project.service.js', () => ({
  assertProjectAccess: vi.fn(),
}));

// 타입 안전한 모킹 캐스팅
const mockFindById = featureRepo.findById as ReturnType<typeof vi.fn>;
```

### 테스트 구조 가이드

```typescript
// 파일명: feature.service.test.ts
// 위치: modules/feature/__tests__/

describe('functionName', () => {
  // 정상 케이스
  it('should [expected behavior] when [condition]', async () => {});

  // 에러 케이스
  it('should throw NotFoundError when resource does not exist', async () => {});

  // 경계값
  it('should handle empty array input', async () => {});

  // 권한 검증
  it('should call assertProjectAccess with correct params', async () => {});
});
```

### 도구 설정

- Vitest globals: true (describe, it, expect를 import 없이 사용 가능하지만, 기존 코드는 명시적 import 사용 — 기존 패턴 유지)
- coverage exclude: `__tests__`, `index.ts`, `migrations/` (이미 설정됨)
- 환경: node (API), jsdom (Web)

---

## 통합 테스터 전달 사항

### 테스트 범위

- **Routes 통합 테스트**: 모든 API 모듈의 routes.ts (P0~P2 우선)
- **Repository 통합 테스트**: 핵심 모듈의 repository.ts (P0 우선)
- **Plugin 통합 테스트**: auth, error-handler, auto-sync

### 테스트 환경

**Fastify Inject 패턴 (Routes 테스트)**

```typescript
// 공통 헬퍼: test-helpers/build-app.ts
import { buildApp } from '../../app.js';

async function createTestApp() {
  const app = await buildApp({
    /* test overrides */
  });
  return app;
}

// JWT 토큰 생성 헬퍼
function createTestToken(payload: { userId: string; name: string }) {
  return app.jwt.sign(payload);
}
```

**DB 연결 전략 (Repository 테스트)**

- 옵션 A (권장): Testcontainers — 테스트 스위트당 PostgreSQL 컨테이너 자동 생성/소멸
- 옵션 B: docker-compose.test.yml + 트랜잭션 롤백 — 기존 인프라 재활용
- 두 옵션 모두 마이그레이션을 테스트 전 자동 실행

### 외부 의존성 전략

| 외부 서비스                         | 전략                        | 비고                                |
| ----------------------------------- | --------------------------- | ----------------------------------- |
| Anthropic API                       | vi.mock (모듈 레벨)         | 비용/비결정성 제거                  |
| Slack Webhook                       | vi.mock (모듈 레벨)         | 네트워크 의존성 제거                |
| 파일 시스템 (plans, local-sessions) | vi.mock('node:fs/promises') | 기존 패턴 유지                      |
| PostgreSQL                          | 테스트 DB (실제 연결)       | Testcontainers 또는 서비스 컨테이너 |

### Vitest 설정 분리 (권장)

```typescript
// vitest.integration.config.ts (신규)
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.integration.test.ts'],
    testTimeout: 30_000, // DB 연결 포함
    hookTimeout: 60_000, // 컨테이너 시작 포함
    // ... coverage 설정
  },
});
```

- `*.test.ts` → 단위 테스트
- `*.integration.test.ts` → 통합 테스트
- package.json에 `test:unit`, `test:integration` 스크립트 분리

---

## 커버리지 로드맵: 16% → 80%

### Phase 1: 기반 구축 (0~30일) — 목표 40%

**주요 작업:**

1. 테스트 인프라 구축
   - Fastify inject 테스트 헬퍼 생성
   - JWT 토큰 생성 헬퍼 생성
   - Testcontainers 또는 테스트 DB 설정
   - vitest.integration.config.ts 분리
2. P0 모듈 단위 테스트 완성
   - auth: service 로직 보강 + routes 테스트
   - projects: service 보강 + routes + repository
   - sessions: service 보강 + routes + repository
3. Plugin 테스트
   - auth.plugin, error-handler 보강
4. CI 파이프라인 개선
   - lint/typecheck 병렬 분리
   - 커버리지 threshold를 40%로 설정

**예상 신규 테스트: ~100개**
**예상 커버리지: API 40%+**

### Phase 2: 확장 (30~60일) — 목표 60%

**주요 작업:**

1. P1 모듈 테스트 완성
   - conflicts, local-sessions, plans, notifications
2. P2 모듈 단위 테스트
   - ai-evaluation, prd-analysis, search, activity
3. Repository 통합 테스트 (P0 모듈)
4. Web 페이지/레이아웃 컴포넌트 테스트 추가
5. CI 커버리지 threshold 상향 (60%)

**예상 신규 테스트: ~80개**
**예상 커버리지: API 60%+, Web lines 45%+**

### Phase 3: 완성 (60~90일) — 목표 80%

**주요 작업:**

1. P3 모듈 테스트 완성
   - admin, quota, setup, supabase-onboarding, database
2. Repository 통합 테스트 (P1~P2 모듈)
3. 엣지 케이스, 에러 핸들링, 경계값 테스트 보강
4. Web 기능 컴포넌트 테스트 보강
5. CI 커버리지 threshold 최종 (80/70/80/80)
6. Flaky 테스트 감지 자동화

**예상 신규 테스트: ~60개**
**예상 커버리지: API 80%+, Web lines 60%+**

### 총 예상

| 항목                  | 현재     | Phase 1  | Phase 2  | Phase 3  |
| --------------------- | -------- | -------- | -------- | -------- |
| API 테스트 수         | ~34 파일 | ~50 파일 | ~65 파일 | ~70 파일 |
| API 커버리지          | 16.52%   | 40%      | 60%      | 80%      |
| Web 테스트 수         | ~60 파일 | ~65 파일 | ~75 파일 | ~85 파일 |
| Web lines             | 12%      | 25%      | 45%      | 60%      |
| E2E spec              | ~30      | ~32      | ~35      | ~40      |
| 전체 테스트 시간 (CI) | -        | < 3분    | < 5분    | < 7분    |
