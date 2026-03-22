# ContextSync

AI 개발 컨텍스트 허브 — 개인 또는 팀 단위로 세션, PRD 분석, 플랜을 통합 관리하고 AI로 평가한다.

## Quick Start

```bash
git clone <repo> && cd contextSync
pnpm setup                                  # 원커맨드: install + DB + migrate + seed
pnpm dev                                    # API :3001, Web :5173
```

수동 셋업:

```bash
pnpm install
docker compose up -d                        # PostgreSQL 16
cp apps/api/.env.example apps/api/.env      # JWT_SECRET 자동 기본값 있음
pnpm --filter @context-sync/api migrate     # DB 마이그레이션
pnpm --filter @context-sync/api seed        # 선택: 샘플 데이터
pnpm dev                                    # API :3001, Web :5173
```

## Commands

| Command                                   | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `pnpm dev`                                | 전체 dev 서버 (tsx watch + Vite HMR) |
| `pnpm build`                              | Turborepo 전체 빌드                  |
| `pnpm test`                               | Vitest 전체 실행                     |
| `pnpm test:coverage`                      | 커버리지 리포트 (80% 기준)           |
| `pnpm lint`                               | 전체 린트                            |
| `pnpm typecheck`                          | 전체 타입 체크                       |
| `pnpm clean`                              | dist 정리                            |
| `pnpm --filter @context-sync/api migrate` | DB 마이그레이션 실행                 |

## Project Structure

pnpm workspaces + Turborepo 모노레포.

```
apps/
  api/          # Fastify 5 API 서버
    src/
      config/       env.ts (Zod 검증), database.ts
      database/     client.ts (Kysely), types.ts, migrations/
      plugins/      auth, cors, error-handler
      lib/          api-response.ts (ok, fail, paginated)
      modules/      auth, projects, sessions, conflicts, search, notifications, prd-analysis, activity, plans, invitations, ai-evaluation, admin, db-config, supabase-onboarding
  web/          # React 19 SPA (Vite 6)
    src/
      api/          API 클라이언트
      stores/       Zustand (auth, theme)
      hooks/        React Query + 커스텀 훅
      components/   ui, auth, layout, projects, sessions, conflicts, search, ...
      pages/        라우트 페이지
      lib/          유틸리티
packages/
  shared/       # 공유 타입, 상수, Zod 밸리데이터
    src/
      types/        api.ts, user.ts, project.ts, session.ts, conflict.ts, ...
      constants/    roles, session-status, conflict-severity, model-pricing, ai-evaluation, anthropic-models, claude-plan, invitation-status, prd-analysis
      validators/   session.validator.ts, project.validator.ts
```

## Architecture

### Tech Stack

- **Backend:** Fastify 5, Kysely 0.27, PostgreSQL 16, `@fastify/jwt`
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5, React Router 7
- **Auth:** Email/Name 로컬 인증 → JWT
- **Build:** TypeScript 5.7 (strict), Turborepo, tsx (dev)
- **Test:** Vitest 3, Testing Library

### Module Pattern

각 API 모듈은 4파일 구조를 따른다:

```
modules/<feature>/
  <feature>.routes.ts       # Route handler (FastifyPluginAsync)
  <feature>.service.ts      # 비즈니스 로직 (순수 함수)
  <feature>.repository.ts   # Kysely 데이터 접근
  <feature>.schema.ts       # Zod 입력 검증
  __tests__/
```

- **Routes** → Zod 검증 → Service 호출 → `ok()`/`fail()` 응답
- **Service** → 권한 검사(`assertAccess`) → Repository 호출
- **Repository** → Kysely 쿼리 → 도메인 객체 변환

### API Response Envelope

```typescript
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}
```

헬퍼: `ok(data)`, `fail(error)`, `paginated(data, meta)` — `apps/api/src/lib/api-response.ts`

### Database

- **Kysely** query builder (full ORM 아님), pool max 20
- **Migrations:** `apps/api/src/database/migrations/` (001–024)
- **Full-text search:** `sessions.search_vector`, `messages.search_vector` (tsvector)
- **스키마 타입:** `apps/api/src/database/types.ts`

### Error Classes

`AppError(message, statusCode)` 기반 — `NotFoundError(404)`, `UnauthorizedError(401)`, `ForbiddenError(403)`. 글로벌 에러 핸들러가 `fail()` 응답으로 변환.

## Project-Specific Conventions

### ES Modules

`"type": "module"` — 백엔드 import 시 `.js` 확장자 필수.

### Import Aliases

- **Backend:** 상대 경로 (`../../database/client.js`)
- **Frontend:** `@/*` alias (`@/hooks/use-projects`)
- **공유 타입:** `@context-sync/shared`에서 import

### Service Functions

클래스가 아닌 순수 함수 export. 첫 번째 인자로 `db` 전달:

```typescript
export async function createProject(
  db: Db,
  userId: string,
  input: CreateProjectInput,
): Promise<Project>;
```

### Environment

`apps/api/.env`에서 관리. `config/env.ts`가 Zod로 시작 시 검증.

필수: `DATABASE_URL`

기본값 있음: `JWT_SECRET` (개발용 기본값 내장, 프로덕션에서는 반드시 override), `FRONTEND_URL`, `JWT_EXPIRES_IN` (`'7d'`), `ANTHROPIC_MODEL` (`'claude-sonnet-4-20250514'`), `EMAIL_FROM` (`'noreply@contextsync.dev'`), `DEPLOYMENT_MODE` (`'personal'`), `DATABASE_SSL` (`'false'`), `RUN_MIGRATIONS` (`'true'`), `DATABASE_PROVIDER` (`'self-hosted'`)

선택: `ANTHROPIC_API_KEY` (PRD 분석 / AI 평가), `SLACK_WEBHOOK_URL`, `RESEND_API_KEY`, `DATABASE_SSL_CA`

### Frontend State

- **Zustand:** `useAuthStore` (token, user, currentProjectId — localStorage 영속), `useThemeStore`
- **React Query:** 쿼리 키 패턴 `['resource', id, filter]`, mutation 후 `invalidateQueries`

### File Naming

- 백엔드: `kebab-case.suffix.ts` (`auth.routes.ts`, `project.service.ts`)
- 프론트: 컴포넌트 `PascalCase.tsx`, 훅/유틸 `kebab-case.ts`
- DB 컬럼: `snake_case`, 테이블: 복수형 소문자

## Documentation Sync

소스 파일 수정 시 관련 문서도 함께 업데이트한다.

| 소스 경로                                                  | 문서                                |
| ---------------------------------------------------------- | ----------------------------------- |
| `apps/web/src/components/ui/`                              | `docs/design-system.md`             |
| `apps/web/src/index.css`                                   | `docs/design-system.md`             |
| `apps/web/src/stores/theme.store.ts`, `hooks/use-theme.ts` | `docs/design-system.md`             |
| `apps/web/src/components/layout/`                          | `docs/design-system.md`             |
| `apps/api/src/modules/` (새 모듈)                          | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/database/migrations/` (새 마이그레이션)      | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/database/types.ts`                           | `docs/architecture.md`              |
| `apps/api/src/config/env.ts`                               | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/app.ts`                                      | `docs/architecture.md`              |
| `apps/web/src/routes.tsx`                                  | `docs/architecture.md`              |
| `packages/shared/src/`                                     | `docs/architecture.md`              |
| E2E 테스트 추가/수정                                       | `docs/E2E_TC.md`                    |

상세 문서: [Design System](docs/design-system.md) · [Architecture](docs/architecture.md) · [E2E Test Cases](docs/E2E_TC.md)
대량 변경 시 `doc-updater` 에이전트로 일괄 동기화.
