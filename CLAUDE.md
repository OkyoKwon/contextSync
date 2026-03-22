# ContextSync

AI development context hub — manage sessions, PRD analysis, and plans for individuals or teams, with AI-powered evaluation.

## Quick Start

### Prerequisites

- **Node.js 22+** — `node -v`
- **pnpm** — `corepack enable` (ships with Node.js)
- **Docker** — for local PostgreSQL (`docker compose up -d`)

```bash
git clone <repo> && cd contextSync
pnpm setup                                  # One command: install + DB + migrate + seed
pnpm dev                                    # API :3001, Web :5173
```

Manual setup:

```bash
pnpm install
docker compose up -d                        # PostgreSQL 16
cp apps/api/.env.example apps/api/.env      # JWT_SECRET has built-in dev default
pnpm --filter @context-sync/api migrate     # Run DB migrations
pnpm --filter @context-sync/api seed        # Optional: sample data
pnpm dev                                    # API :3001, Web :5173
```

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
      modules/      auth, projects, sessions, conflicts, search, notifications, prd-analysis, activity, plans, invitations, ai-evaluation, admin, db-config, supabase-onboarding
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
      constants/    roles, session-status, conflict-severity, model-pricing, ai-evaluation, anthropic-models, claude-plan, invitation-status, prd-analysis
      validators/   session.validator.ts, project.validator.ts
```

## Architecture

### Tech Stack

- **Backend:** Fastify 5, Kysely 0.27, PostgreSQL 16, `@fastify/jwt`
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5, React Router 7
- **Auth:** Email/Name local auth → JWT
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
- **Migrations:** `apps/api/src/database/migrations/` (001–025)
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

Optional: `ANTHROPIC_API_KEY` (PRD analysis / AI evaluation), `SLACK_WEBHOOK_URL`, `DATABASE_SSL_CA`

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
