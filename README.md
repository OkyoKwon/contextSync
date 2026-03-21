# ContextSync

[![CI](https://github.com/OkyoKwon/contextSync/actions/workflows/ci.yml/badge.svg)](https://github.com/OkyoKwon/contextSync/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AI session context management platform — archive, sync, search, and manage Claude Code sessions — solo or with your team.

## Tech Stack

| Layer    | Stack                                                  |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Zustand, React Query |
| Backend  | Fastify 5, Kysely, Zod                                 |
| Database | PostgreSQL 16                                          |
| Auth     | Email/Name local auth + JWT                            |
| Monorepo | pnpm workspaces + Turborepo                            |

## Getting Started

### Prerequisites

- **Node.js 22** (see [.nvmrc](.nvmrc) — run `nvm use`)
- **pnpm 9+** (`corepack enable`)
- **Docker** (for personal and team-host modes only — not needed for team-member)

### Quick Setup (One Command)

```bash
pnpm install
pnpm setup               # Installs deps, starts DB, migrates, seeds
pnpm dev
```

> Or run `bash scripts/setup.sh` (without `--defaults`) for an interactive wizard with deployment mode selection.

### Manual Setup

<details>
<summary>Personal mode (default — solo, local DB)</summary>

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env    # JWT_SECRET has dev default
pnpm --filter @context-sync/api migrate
pnpm --filter @context-sync/api seed      # Optional: sample data
pnpm dev
```

</details>

<details>
<summary>Team Host (admin hosting shared DB)</summary>

```bash
pnpm install
# Place SSL certs in certs/ directory
docker compose --profile team-host up -d
cp apps/api/.env.example apps/api/.env
# Set DEPLOYMENT_MODE=team-host, DATABASE_SSL=true
pnpm --filter @context-sync/api migrate
pnpm dev
```

</details>

<details>
<summary>Team Member (connecting to remote DB)</summary>

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# Set DATABASE_URL to remote DB, DATABASE_SSL=true, RUN_MIGRATIONS=false
pnpm dev
```

No Docker required.

</details>

Open `http://localhost:5173` and sign in with your name and email.

API runs at `http://localhost:3001`.

### Environment Variables

| Variable            | Required | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`      | Yes      | PostgreSQL connection string                                       |
| `JWT_SECRET`        | No       | JWT signing key (min 32 chars, dev default built-in)               |
| `JWT_EXPIRES_IN`    | No       | Token expiry (default: `7d`)                                       |
| `FRONTEND_URL`      | No       | Frontend URL (default: `http://localhost:5173`)                    |
| `ANTHROPIC_API_KEY` | No       | For PRD analysis feature                                           |
| `SLACK_WEBHOOK_URL` | No       | Slack notification webhook                                         |
| `RESEND_API_KEY`    | No       | Email notifications                                                |
| `DEPLOYMENT_MODE`   | No       | `personal` (default), `team-host`, or `team-member`                |
| `DATABASE_SSL`      | No       | Enable SSL for DB connection (default: `false`)                    |
| `DATABASE_SSL_CA`   | No       | Path to CA certificate for self-signed certs                       |
| `RUN_MIGRATIONS`    | No       | Auto-run migrations (default: `true`, set `false` for team-member) |

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
├── auth/            # GitHub OAuth + JWT
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

## Deployment Modes

| Mode          | Docker? | DB          | Use Case                          |
| ------------- | ------- | ----------- | --------------------------------- |
| `personal`    | Yes     | Local       | Solo dev, private session archive |
| `team-host`   | Yes     | Local + SSL | Admin hosting shared DB           |
| `team-member` | No      | Remote      | Dev connecting to team DB         |

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
