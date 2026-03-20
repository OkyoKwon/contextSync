# ContextSync

AI 세션 컨텍스트 관리 플랫폼 — Claude Code 세션을 팀 단위로 아카이브·동기화·검색·충돌 감지한다.

## Quick Start

```bash
pnpm install
docker compose up -d                        # PostgreSQL 16
cp apps/api/.env.example apps/api/.env      # DEV_AUTH_MODE=true 기본값
pnpm --filter @context-sync/api migrate     # DB 마이그레이션
pnpm --filter @context-sync/api seed        # 선택: 샘플 데이터
pnpm dev                                    # API :3001, Web :5173
# → http://localhost:5173 → "Dev Login" 클릭
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
      modules/      auth, projects, sessions, conflicts, search, notifications, prd-analysis, users
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
      constants/    roles, session-status, conflict-severity, model-pricing
      validators/   session.validator.ts, project.validator.ts
```

## Architecture

### Tech Stack

- **Backend:** Fastify 5, Kysely 0.27, PostgreSQL 16, `@fastify/jwt`
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5, React Router 7
- **Auth:** GitHub OAuth → JWT
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
- **Migrations:** `apps/api/src/database/migrations/` (001–013)
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

필수: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

조건부: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (`DEV_AUTH_MODE=false`일 때 필수)

선택: `DEV_AUTH_MODE` (로컬 개발용 OAuth 우회), `ANTHROPIC_API_KEY` (PRD 분석), `SLACK_WEBHOOK_URL`, `RESEND_API_KEY`

### Frontend State

- **Zustand:** `useAuthStore` (token, user, currentProjectId — localStorage 영속), `useThemeStore`
- **React Query:** 쿼리 키 패턴 `['resource', id, filter]`, mutation 후 `invalidateQueries`

### File Naming

- 백엔드: `kebab-case.suffix.ts` (`auth.routes.ts`, `project.service.ts`)
- 프론트: 컴포넌트 `PascalCase.tsx`, 훅/유틸 `kebab-case.ts`
- DB 컬럼: `snake_case`, 테이블: 복수형 소문자

## Documentation Sync

소스 파일 수정 시 관련 문서도 함께 업데이트한다.

| 소스 경로                                                  | 문서                            |
| ---------------------------------------------------------- | ------------------------------- |
| `apps/web/src/components/ui/`                              | `docs/디자인시스템.md`          |
| `apps/web/src/index.css`                                   | `docs/디자인시스템.md`          |
| `apps/web/src/stores/theme.store.ts`, `hooks/use-theme.ts` | `docs/디자인시스템.md`          |
| `apps/web/src/components/layout/`                          | `docs/디자인시스템.md`          |
| `apps/api/src/modules/` (새 모듈)                          | `docs/아키텍쳐.md`, `CLAUDE.md` |
| `apps/api/src/database/migrations/` (새 마이그레이션)      | `docs/아키텍쳐.md`, `CLAUDE.md` |
| `apps/api/src/database/types.ts`                           | `docs/아키텍쳐.md`              |
| `apps/api/src/config/env.ts`                               | `docs/아키텍쳐.md`, `CLAUDE.md` |
| `apps/api/src/app.ts`                                      | `docs/아키텍쳐.md`              |
| `apps/web/src/routes.tsx`                                  | `docs/아키텍쳐.md`              |
| `packages/shared/src/`                                     | `docs/아키텍쳐.md`              |

상세 문서: [디자인시스템](docs/디자인시스템.md) · [아키텍쳐](docs/아키텍쳐.md)
대량 변경 시 `doc-updater` 에이전트로 일괄 동기화.
