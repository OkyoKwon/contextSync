# Contributing to ContextSync

Thank you for your interest in contributing to ContextSync! This guide will help you get started.

## Prerequisites

- **Node.js 22** (see [.nvmrc](.nvmrc) — run `nvm use`)
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker** (for personal and team-host modes — not needed for team-member contributors)

## Quick Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/contextSync.git
cd contextSync

# 2. One-command setup (installs deps, starts DB, runs migrations, seeds data)
pnpm setup

# 3. Start dev servers
pnpm dev
# API → http://localhost:3001
# Web → http://localhost:5173
```

> **Tip:** Run `bash scripts/setup.sh` (without `--defaults`) for an interactive setup wizard with deployment mode selection.

Sign in with your name and email at `http://localhost:5173`.

## Project Structure

```
apps/
  api/          # Fastify 5 API server
  web/          # React 19 SPA (Vite 6)
packages/
  shared/       # Shared types, validators, constants
```

### Backend Module Pattern

Each API module follows a 4-file structure:

```
modules/<feature>/
  <feature>.routes.ts       # Route handlers (FastifyPluginAsync)
  <feature>.service.ts      # Business logic (pure functions)
  <feature>.repository.ts   # Kysely data access
  <feature>.schema.ts       # Zod input validation
  __tests__/                # Tests
```

- **Routes** validate input with Zod, call service, return `ok()` / `fail()`
- **Services** are pure functions with `db` as the first argument — no classes
- **Repositories** handle Kysely queries and transform to domain objects

## Code Style

- **Immutability**: Always create new objects, never mutate
- **Pure functions**: Export functions, not classes. Pass `db` as the first argument
- **File naming**: Backend `kebab-case.suffix.ts`, Components `PascalCase.tsx`, hooks/utils `kebab-case.ts`
- **Imports**: Backend uses relative paths with `.js` extension. Frontend uses `@/*` alias. Shared types from `@context-sync/shared`
- **Small files**: 200–400 lines typical, 800 max
- **Error handling**: Use `AppError` subclasses (`NotFoundError`, `ForbiddenError`, etc.)

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Making Changes

### Branch Naming

```
feat/short-description
fix/short-description
refactor/short-description
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add session export to CSV
fix: prevent duplicate conflict detection
refactor: extract pagination helper
docs: update API module documentation
test: add integration tests for search
```

### Testing

```bash
pnpm test                 # Run all tests
pnpm test:coverage        # Run with coverage (80% threshold)
pnpm typecheck            # Type check all packages
```

- Tests are required for new features and bug fixes
- Backend coverage threshold: 80% (branches, functions, lines, statements)
- Write tests alongside your code in `__tests__/` directories

## Pull Request Process

1. **Fork** the repository and create a branch from `main`
2. **Make your changes** following the code style above
3. **Add tests** for new functionality
4. **Run checks** locally:
   ```bash
   pnpm typecheck && pnpm test
   ```
5. **Push** to your fork and open a Pull Request
6. Fill out the PR template — describe what changed and why
7. Wait for CI to pass and a maintainer review

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Update documentation if you change public APIs or add modules
- Reference related issues with `Closes #123` or `Fixes #123`

## Reporting Issues

- **Bug reports**: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature requests**: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
