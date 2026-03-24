# Setup Guide

Detailed setup instructions for all deployment modes. For a quick start, see the [README](../README.md#quick-start).

---

## Prerequisites

### Required Software

| Software | Version | Check       | Install                                                                 |
| -------- | ------- | ----------- | ----------------------------------------------------------------------- |
| Node.js  | 22+     | `node -v`   | [nodejs.org](https://nodejs.org/) or via nvm                            |
| pnpm     | 9+      | `pnpm -v`   | `corepack enable` or `npm install -g pnpm`                              |
| Docker   | Latest  | `docker -v` | [docker.com](https://www.docker.com/) (not needed for Team Member mode) |

### macOS Install (Homebrew + nvm)

```bash
# 1. Homebrew (skip if already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. nvm (Node Version Manager)
brew install nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

# 3. Node.js 22 (project uses .nvmrc)
nvm install 22
nvm use 22

# 4. Docker Desktop
brew install --cask docker

# 5. Enable pnpm
corepack enable
```

> **Note:** After installing Docker Desktop, launch the app once to activate the `docker` CLI.
> Verify with `node -v` (should be v22+).

### Other Platforms

Install Node.js 22 from [nodejs.org](https://nodejs.org/) or via your platform's package manager. Then enable pnpm:

```bash
corepack enable
# If corepack is unavailable:
npm install -g pnpm
```

Install Docker Desktop from [docker.com](https://www.docker.com/).

---

## Setup Modes

### Personal Mode (Default)

Solo developer with a local PostgreSQL database. Simplest setup — everything runs on one machine.

```bash
pnpm install
docker compose up -d                        # PostgreSQL 16
cp apps/api/.env.example apps/api/.env      # JWT_SECRET has built-in dev default
pnpm --filter @context-sync/api migrate     # Run DB migrations
pnpm --filter @context-sync/api seed        # Optional: sample data
pnpm dev                                    # API :3001, Web :5173
```

Or use the one-command bootstrap:

```bash
corepack enable
pnpm bootstrap    # Docker up → DB migration → seed data
pnpm dev
```

> `pnpm bootstrap` runs `scripts/setup.sh --defaults`. For an interactive wizard with deployment mode selection, run `bash scripts/setup.sh` directly.

### Team Host Mode

Admin hosting a shared project. Uses a local DB for metadata and a remote DB (e.g., Supabase) for shared data.

```bash
pnpm install

# SSL certificates are auto-generated on first start.
# To use your own CA-signed certs, place them in docker/ssl/ before starting.
docker compose --profile team-host up -d

cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your team configuration:

```bash
DATABASE_SSL=true
REMOTE_DATABASE_URL=postgresql://...    # Remote DB for team sharing
REMOTE_DATABASE_SSL=true
```

Then run migrations and start:

```bash
pnpm --filter @context-sync/api migrate
pnpm dev
```

### Team Member Mode

Developer joining an existing team project. No Docker required.

```bash
pnpm install
pnpm setup:team    # Interactive: DB URL + name + Join Code
pnpm dev
```

The interactive setup configures the remote DB connection and joins the team project automatically.

---

## Environment Variables

Managed in `apps/api/.env`. The `config/env.ts` module validates all variables at startup using Zod.

Only `DATABASE_URL` is required. All others have sensible defaults.

| Variable                 | Required | Default                    | Description                                                     |
| ------------------------ | -------- | -------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`           | **Yes**  | —                          | PostgreSQL connection string                                    |
| `JWT_SECRET`             | No       | Built-in dev default       | JWT signing key (min 32 chars, **must override in production**) |
| `JWT_EXPIRES_IN`         | No       | `7d`                       | Token expiry duration                                           |
| `HOST`                   | No       | `0.0.0.0`                  | Server bind address                                             |
| `NODE_ENV`               | No       | `development`              | `development`, `production`, or `test`                          |
| `FRONTEND_URL`           | No       | `http://localhost:5173`    | Frontend origin for CORS                                        |
| `ANTHROPIC_API_KEY`      | No       | —                          | Enables PRD analysis and AI evaluation features                 |
| `ANTHROPIC_MODEL`        | No       | `claude-sonnet-4-20250514` | Claude model ID for AI features                                 |
| `SLACK_WEBHOOK_URL`      | No       | —                          | Slack notification webhook URL                                  |
| `DATABASE_SSL`           | No       | `false`                    | Enable SSL for DB connection                                    |
| `DATABASE_SSL_CA`        | No       | —                          | Path to CA certificate for self-signed certs                    |
| `RUN_MIGRATIONS`         | No       | `true`                     | Auto-run migrations on startup (set `false` for team-member)    |
| `REMOTE_DATABASE_URL`    | No       | —                          | Remote PostgreSQL URL for dual-pool routing                     |
| `REMOTE_DATABASE_SSL`    | No       | `false`                    | Enable SSL for remote DB                                        |
| `REMOTE_DATABASE_SSL_CA` | No       | —                          | Path to CA certificate for remote DB SSL                        |

---

## Troubleshooting

### Docker Not Running

```
Cannot connect to the Docker daemon
```

Start Docker Desktop and wait for it to initialize. On macOS, launch the Docker Desktop app at least once after installation.

### Port Already in Use

```
Error: listen EADDRINUSE :::5432
```

Another service is using the port. Stop it or change the port in `docker-compose.yml`:

```bash
DB_PORT=5433 docker compose up -d
```

### nvm Not Found After Install

If `nvm` is not recognized after installation, ensure the init script is in your shell config:

```bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
```

### Bootstrap Fails

If `pnpm bootstrap` fails, try the manual setup steps to isolate the issue:

```bash
docker compose up -d                        # Is Docker running?
pnpm install                                # Dependency issues?
pnpm --filter @context-sync/api migrate     # DB connection ok?
```
