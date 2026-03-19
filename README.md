# ContextSync

AI 세션 컨텍스트를 팀 단위로 아카이브하고 동기화하는 플랫폼.
Claude Code 세션을 자동으로 읽어 타임라인, 충돌 감지, 검색 기능을 제공합니다.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Zustand, React Query |
| Backend | Fastify 5, Kysely, Zod |
| Database | PostgreSQL 16 |
| Auth | GitHub OAuth + JWT |
| Monorepo | pnpm workspaces + Turborepo |

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
├── teams/           # Team CRUD
├── projects/        # Project management
├── sessions/        # Session import, sync, parsing
├── conflicts/       # Conflict detection & resolution
├── search/          # Full-text search
└── notifications/   # Slack & email alerts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your GitHub OAuth credentials and JWT secret

# 4. Run database migrations
pnpm --filter @context-sync/api migrate

# 5. Start dev servers
pnpm dev
```

API runs at `http://localhost:3001`, web at `http://localhost:5173`.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `FRONTEND_URL` | No | Frontend URL (default: `http://localhost:5173`) |
| `SLACK_WEBHOOK_URL` | No | Slack notification webhook |
| `RESEND_API_KEY` | No | Resend email API key |

## Key Features

### Session Sync

로컬 Claude Code 세션(`~/.claude/projects/`)을 자동 스캔하여 웹에서 동기화합니다.
활성 세션만 기본 표시되며, 프로젝트별로 그룹핑됩니다.

### Conflict Detection

동일 파일을 여러 팀원이 동시에 수정한 경우 자동으로 충돌을 감지하고 severity를 분류합니다.

### Full-text Search

세션 제목, 메시지 내용, 파일 경로, 태그를 대상으로 PostgreSQL tsvector 기반 전문 검색을 지원합니다.

## Scripts

```bash
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
```
