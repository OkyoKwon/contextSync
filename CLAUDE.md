# ContextSync

AI development context hub — manage sessions, PRD analysis, and plans for individuals or teams, with AI-powered evaluation.

## Quick Start

### Prerequisites

- **Node.js 22+** — `node -v`
- **pnpm** — `corepack enable` or `npm install -g pnpm`
- **Docker** — for local PostgreSQL (`docker compose up -d`)

macOS install (Homebrew + nvm):

```bash
brew install nvm && nvm install 22 && brew install --cask docker && corepack enable
```

> nvm 최초 설치 시 쉘 설정(~/.zshrc)에 nvm 초기화 스크립트 추가 필요. 자세한 내용은 README 참조.
> Docker Desktop 설치 후 앱을 한 번 실행해야 `docker` CLI가 활성화됩니다.

```bash
git clone <repo> && cd contextSync
bash scripts/setup.sh
pnpm dev
```

`setup.sh`은 Node 22 자동 설치, Docker 기동, DB 마이그레이션, 시드 데이터 로드까지 수행합니다.
이후 `pnpm dev`로 서버를 시작합니다. API는 :3001, Web은 :5173 포트에서 접근 가능합니다.

Manual setup:

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @context-sync/api migrate
pnpm --filter @context-sync/api seed
pnpm dev
```

### Team Setup (for team members joining an existing project)

```bash
pnpm setup:team                # Interactive: DB URL + name + Join Code
pnpm dev:profile <name>        # Run profile instance (separate ports)
```

Join Code로 프로젝트에 참여하면 프로젝트 이름에서 프로필이 자동 생성되어 `.env.{name}`에 별도 포트가 할당됩니다. 기존 `.env`는 건드리지 않습니다. Join Code 없이 실행하면 기존 `.env`에 작성 (하위 호환).

## Commands

| Command                                   | Description                            |
| ----------------------------------------- | -------------------------------------- |
| `pnpm dev`                                | Full dev server (tsx watch + Vite HMR) |
| `pnpm build`                              | Turborepo full build                   |
| `pnpm test`                               | Run all Vitest tests                   |
| `pnpm test:coverage`                      | Coverage report (80% threshold)        |
| `pnpm lint`                               | Lint all packages                      |
| `pnpm typecheck`                          | Type check all packages                |
| `pnpm clean`                              | Clean dist outputs                     |
| `pnpm --filter @context-sync/api migrate` | Run DB migrations                      |
| `pnpm setup:team`                         | Team member one-command setup          |
| `pnpm dev:profile <name>`                 | Run a named profile instance           |

## Project Structure

pnpm workspaces + Turborepo monorepo.

```
apps/
  api/          # Fastify 5 API server
    src/
      config/       env.ts (Zod validation), database.ts
      database/     client.ts (Kysely), types.ts, migrations/
      plugins/      auth, cors, error-handler
      lib/          api-response.ts (ok, fail, paginated)
      modules/      auth, projects, sessions, conflicts, search, notifications, prd-analysis, activity, plans, ai-evaluation, admin, local-sessions, supabase-onboarding, setup, quota
  web/          # React 19 SPA (Vite 6)
    src/
      api/          API client
      stores/       Zustand (auth, theme)
      hooks/        React Query + custom hooks
      components/   ui, auth, layout, projects, sessions, conflicts, search, ...
      pages/        Route pages
      lib/          Utilities
packages/
  shared/       # Shared types, constants, Zod validators
    src/
      types/        api.ts, user.ts, project.ts, session.ts, conflict.ts, ...
      constants/    roles, session-status, conflict-severity, model-pricing, ai-evaluation, anthropic-models, claude-plan, rate-limit-thresholds, prd-analysis
      validators/   session.validator.ts, project.validator.ts
```

## Architecture

### Tech Stack

- **Backend:** Fastify 5, Kysely 0.27, PostgreSQL 16, `@fastify/jwt`
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5, React Router 7
- **Auth:** Name-based identity → JWT
- **Build:** TypeScript 5.7 (strict), Turborepo, tsx (dev)
- **Test:** Vitest 3, Testing Library

### Module Pattern

Each API module follows a 4-file structure:

```
modules/<feature>/
  <feature>.routes.ts       # Route handler (FastifyPluginAsync)
  <feature>.service.ts      # Business logic (pure functions)
  <feature>.repository.ts   # Kysely data access
  <feature>.schema.ts       # Zod input validation
  __tests__/
```

- **Routes** → Zod validation → Service call → `ok()`/`fail()` response
- **Service** → Authorization check (`assertAccess`) → Repository call
- **Repository** → Kysely query → Domain object mapping

### API Response Envelope

```typescript
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}
```

Helpers: `ok(data)`, `fail(error)`, `paginated(data, meta)` — `apps/api/src/lib/api-response.ts`

### Database

- **Kysely** query builder (not a full ORM), pool max 20
- **Migrations:** `apps/api/src/database/migrations/` (001–027)
- **Full-text search:** `sessions.search_vector`, `messages.search_vector` (tsvector)
- **Schema types:** `apps/api/src/database/types.ts`

### Error Classes

Based on `AppError(message, statusCode)` — `NotFoundError(404)`, `UnauthorizedError(401)`, `ForbiddenError(403)`. Global error handler converts to `fail()` responses.

## Project-Specific Conventions

### ES Modules

`"type": "module"` — backend imports require `.js` extension.

### Import Aliases

- **Backend:** Relative paths (`../../database/client.js`)
- **Frontend:** `@/*` alias (`@/hooks/use-projects`)
- **Shared types:** Import from `@context-sync/shared`

### Service Functions

Export pure functions, not classes. First argument is `db`:

```typescript
export async function createProject(
  db: Db,
  userId: string,
  input: CreateProjectInput,
): Promise<Project>;
```

### Environment

Managed in `apps/api/.env`. `config/env.ts` validates at startup using Zod.

Required: `DATABASE_URL`

With defaults: `JWT_SECRET` (built-in dev default, must override in production), `FRONTEND_URL`, `JWT_EXPIRES_IN` (`'7d'`), `ANTHROPIC_MODEL` (`'claude-sonnet-4-20250514'`), `DATABASE_SSL` (`'false'`), `RUN_MIGRATIONS` (`'true'`)

Optional: `ANTHROPIC_API_KEY` (PRD analysis / AI evaluation), `SLACK_WEBHOOK_URL`, `DATABASE_SSL_CA`, `REMOTE_DATABASE_URL` (remote DB for dual-pool routing), `REMOTE_DATABASE_SSL` (`'false'`), `REMOTE_DATABASE_SSL_CA`

### Frontend State

- **Zustand:** `useAuthStore` (token, user, currentProjectId — persisted to localStorage), `useThemeStore`
- **React Query:** Query key pattern `['resource', id, filter]`, `invalidateQueries` after mutations

### File Naming

- Backend: `kebab-case.suffix.ts` (`auth.routes.ts`, `project.service.ts`)
- Frontend: Components `PascalCase.tsx`, hooks/utils `kebab-case.ts`
- DB columns: `snake_case`, tables: lowercase plural

## Documentation Sync

When modifying source files, update related documentation as well.

| Source Path                                                | Documentation                       |
| ---------------------------------------------------------- | ----------------------------------- |
| `apps/web/src/components/ui/`                              | `docs/design-system.md`             |
| `apps/web/src/index.css`                                   | `docs/design-system.md`             |
| `apps/web/src/stores/theme.store.ts`, `hooks/use-theme.ts` | `docs/design-system.md`             |
| `apps/web/src/components/layout/`                          | `docs/design-system.md`             |
| `apps/api/src/modules/` (new module)                       | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/database/migrations/` (new migration)        | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/database/types.ts`                           | `docs/architecture.md`              |
| `apps/api/src/config/env.ts`                               | `docs/architecture.md`, `CLAUDE.md` |
| `apps/api/src/app.ts`                                      | `docs/architecture.md`              |
| `apps/web/src/routes.tsx`                                  | `docs/architecture.md`              |
| `packages/shared/src/`                                     | `docs/architecture.md`              |
| E2E test additions/changes                                 | `docs/E2E_TC.md`                    |

Detailed docs: [Design System](docs/design-system.md) · [Architecture](docs/architecture.md) · [E2E Test Cases](docs/E2E_TC.md)
For bulk changes, use the `doc-updater` agent for batch sync.
