<div align="center">

# ContextSync

**Stop losing AI development context.**

Session archive · Conflict detection · Team dashboard
for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) teams and solo developers.

[![CI](https://github.com/OkyoKwon/contextSync/actions/workflows/ci.yml/badge.svg)](https://github.com/OkyoKwon/contextSync/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)

[Quick Start](#quick-start) · [Project Site](https://okyokwon.github.io/contextSync/) · [Documentation](docs/architecture.md)

<br/>

<img src="apps/web/public/screenshots/dashboard-full.png" alt="ContextSync Dashboard" width="800" />

</div>

---

## Why ContextSync?

| Problem                | Without ContextSync                             | With ContextSync                                     |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| **Lost context**       | Claude sessions scattered across local machines | Centralized archive with full-text search            |
| **Work conflicts**     | Discover file clashes at merge time             | Real-time conflict detection by severity             |
| **Invisible progress** | "What did the team build today?"                | Dashboard with daily usage charts and activity stats |

---

## Key Features

### Session Archive & Sync

Scans local Claude Code sessions (`~/.claude/projects/`) and syncs to the web dashboard. Active sessions grouped by project.

<img src="apps/web/public/screenshots/session-conversation.png" alt="Session conversation" width="720" />

### Conflict Detection

Detects simultaneous file modifications across team members. Classifies by severity (info / warning / critical) with review workflow.

<img src="apps/web/public/screenshots/conflicts-list.png" alt="Conflict detection" width="720" />

### Dashboard & Analytics

Daily usage charts and 7-day activity stats — session counts, token usage, hot files, and team member activity at a glance.

<img src="apps/web/public/screenshots/dashboard-stats.png" alt="Dashboard analytics" width="720" />

<details>
<summary><strong>More features</strong></summary>

<br/>

| Feature                | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| **PRD Analysis**       | Upload PRDs and track requirement fulfillment with Claude-powered analysis |
| **Plans**              | Structured markdown plans linked to projects from `~/.claude/plans/`       |
| **Full-text Search**   | PostgreSQL tsvector search across sessions, messages, file paths, and tags |
| **AI Evaluation**      | Multi-dimensional scoring of AI utilization with proficiency tiers         |
| **Team Collaboration** | Role-based access (Owner / Member) with project sharing and invitations    |

</details>

---

## Quick Start

> **Prerequisites:** Node.js 22+, pnpm (`corepack enable`), Docker

```bash
git clone https://github.com/OkyoKwon/contextSync.git && cd contextSync
corepack enable
pnpm bootstrap    # Docker up → DB migration → seed data
pnpm dev          # API :3001, Web :5173
```

Open [http://localhost:5173](http://localhost:5173) and enter your name to get started.

> Joining an existing team? Run `pnpm setup:team` instead — no Docker required.
>
> For manual setup, prerequisites install, and environment variables, see the **[Setup Guide](docs/setup-guide.md)**.

---

## Deployment Modes

| Mode            | Setup Command                                       | Docker | Use Case                                 |
| --------------- | --------------------------------------------------- | ------ | ---------------------------------------- |
| **Personal**    | `pnpm bootstrap && pnpm dev`                        | Yes    | Solo dev, local DB                       |
| **Team Host**   | [Setup guide →](docs/setup-guide.md#team-host-mode) | Yes    | Admin hosting shared DB (local + remote) |
| **Team Member** | `pnpm setup:team && pnpm dev:profile <name>`        | No     | Join existing team project               |

---

## Tech Stack

| Layer    | Stack                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5, React Router 7 |
| Backend  | Fastify 5, Kysely, Zod                                                     |
| Database | PostgreSQL 16                                                              |
| Auth     | Name-based identity + JWT                                                  |
| Monorepo | pnpm workspaces + Turborepo                                                |

---

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

<details>
<summary>API Modules</summary>

```
apps/api/src/modules/
├── activity/        # Activity logging
├── admin/           # DB health, migrations, settings
├── ai-evaluation/   # AI utilization scoring
├── auth/            # Name-based identity + JWT
├── conflicts/       # Conflict detection & resolution
├── local-sessions/  # Local session scanning
├── notifications/   # Slack notifications
├── plans/           # Markdown planning documents
├── prd-analysis/    # PRD analysis with AI
├── projects/        # Project management
├── quota/           # Rate limit & quota tracking
├── search/          # Full-text search
├── sessions/        # Session import, sync, parsing
├── setup/           # Database connection & team setup
└── supabase-onboarding/ # Supabase guided setup
```

</details>

---

## Scripts

```bash
pnpm dev              # Start all services (API + Web)
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage (80% threshold)
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm setup:team       # Team member interactive setup
```

---

## Contributing

Key conventions — [full guide in CONTRIBUTING.md](CONTRIBUTING.md):

- **Module pattern:** `routes → service → repository → schema` ([4-file structure](CONTRIBUTING.md#backend-module-pattern))
- **Immutability:** always return new objects, never mutate existing ones
- **Testing:** 80% coverage required — `pnpm test:coverage`

Looking for a place to start? Check out [**good first issues**](https://github.com/OkyoKwon/contextSync/labels/good%20first%20issue).
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## Roadmap

- [ ] Session export (JSON, CSV)
- [ ] GitHub integration (link sessions to PRs/issues)
- [ ] Real-time collaboration (WebSocket-based live sync)
- [ ] Plugin system for custom session processors
- [ ] Self-hosted Docker image (single `docker run` deployment)
- [ ] VS Code extension for session management

Have an idea? [Open a feature request](https://github.com/OkyoKwon/contextSync/issues/new?template=feature_request.md).

---

## Community

- [GitHub Issues](https://github.com/OkyoKwon/contextSync/issues) — Bug reports & feature requests
- [GitHub Discussions](https://github.com/OkyoKwon/contextSync/discussions) — Questions & ideas

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for reporting instructions.

---

Built with [Fastify](https://fastify.dev/) · [React](https://react.dev/) · [Kysely](https://kysely.dev/) · [Vite](https://vite.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Turborepo](https://turbo.build/)

[MIT License](LICENSE)
