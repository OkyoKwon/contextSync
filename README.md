# ContextSync

[![CI](https://github.com/context-sync/contextSync/actions/workflows/ci.yml/badge.svg)](https://github.com/context-sync/contextSync/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI session context management platform — archive, sync, search, and detect conflicts across Claude Code sessions for teams.

## Tech Stack

| Layer    | Stack                                                  |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Zustand, React Query |
| Backend  | Fastify 5, Kysely, Zod                                 |
| Database | PostgreSQL 16                                          |
| Auth     | GitHub OAuth + JWT (with dev mode)                     |
| Monorepo | pnpm workspaces + Turborepo                            |

## Getting Started

### Prerequisites

- **Node.js 22** (see [.nvmrc](.nvmrc) — run `nvm use`)
- **pnpm 9+** (`corepack enable`)
- **Docker** (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment (DEV_AUTH_MODE=true by default — no GitHub OAuth needed)
cp apps/api/.env.example apps/api/.env

# 4. Run database migrations
pnpm --filter @context-sync/api migrate

# 5. (Optional) Load sample data
pnpm --filter @context-sync/api seed

# 6. Start dev servers
pnpm dev
```

Open `http://localhost:5173` and click **"Dev Login"** to sign in.

API runs at `http://localhost:3001`.

### Dev Auth Mode

By default, the app runs with `DEV_AUTH_MODE=true`, which lets you sign in without GitHub OAuth credentials. To use real GitHub OAuth, set `DEV_AUTH_MODE=false` and provide your `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

### Environment Variables

| Variable               | Required                 | Description                                                   |
| ---------------------- | ------------------------ | ------------------------------------------------------------- |
| `DATABASE_URL`         | Yes                      | PostgreSQL connection string                                  |
| `DEV_AUTH_MODE`        | No                       | `true` to skip GitHub OAuth (default: `true` in .env.example) |
| `GITHUB_CLIENT_ID`     | When DEV_AUTH_MODE=false | GitHub OAuth app client ID                                    |
| `GITHUB_CLIENT_SECRET` | When DEV_AUTH_MODE=false | GitHub OAuth app client secret                                |
| `JWT_SECRET`           | Yes                      | JWT signing key (min 32 chars)                                |
| `JWT_EXPIRES_IN`       | No                       | Token expiry (default: `7d`)                                  |
| `FRONTEND_URL`         | No                       | Frontend URL (default: `http://localhost:5173`)               |
| `ANTHROPIC_API_KEY`    | No                       | For PRD analysis feature                                      |
| `SLACK_WEBHOOK_URL`    | No                       | Slack notification webhook                                    |
| `RESEND_API_KEY`       | No                       | Email notifications                                           |

## Project Structure

```
contextSync/
├── apps/
│   ├── api/          # Fastify API server (port 3001)
│   └── web/          # React SPA (port 5173)
├── packages/
│   └── shared/       # Shared types, validators, constants
└── docker-compose.yml
```

### API Modules

```
apps/api/src/modules/
├── auth/            # GitHub OAuth + JWT + Dev auth
├── users/           # User management
├── projects/        # Project management
├── sessions/        # Session import, sync, parsing
├── conflicts/       # Conflict detection & resolution
├── search/          # Full-text search
├── notifications/   # Slack & email alerts
├── prd-analysis/    # PRD analysis with AI
└── activity/        # Activity logging
```

## Key Features

### Session Sync

Automatically scans local Claude Code sessions (`~/.claude/projects/`) and syncs them to the web dashboard. Active sessions are shown by default, grouped by project.

### Conflict Detection

Detects when multiple team members modify the same files simultaneously and classifies conflicts by severity.

### Full-text Search

PostgreSQL tsvector-based search across session titles, message content, file paths, and tags.

## Scripts

```bash
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding guidelines, and PR process.

## License

[MIT](LICENSE)
