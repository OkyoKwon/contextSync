#!/usr/bin/env bash
set -euo pipefail

DEFAULTS=false
for arg in "$@"; do
  case $arg in
    --defaults) DEFAULTS=true ;;
  esac
done

echo "=== ContextSync Setup ==="
echo ""

# Check Node.js version
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required. Install Node.js 22+ and try again."
  exit 1
fi

NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "WARNING: Node.js 22+ recommended (found v$(node -v))"
fi

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "ERROR: pnpm is required. Run: corepack enable && corepack prepare pnpm@latest --activate"
  exit 1
fi

if [ "$DEFAULTS" = true ]; then
  # Non-interactive: personal mode with all defaults
  DEPLOYMENT_MODE="personal"
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contextsync"
  DATABASE_SSL="false"
  RUN_MIGRATIONS="true"
  JWT_SECRET=$(openssl rand -base64 48)

  echo "Mode: personal (default)"
  echo ""

  # Install dependencies
  echo "Installing dependencies..."
  pnpm install

  # Docker check + start
  if command -v docker &>/dev/null; then
    echo "Starting PostgreSQL with Docker..."
    docker compose up -d

    echo "Waiting for PostgreSQL to be ready..."
    for i in $(seq 1 30); do
      if docker compose exec -T postgres pg_isready -U postgres &>/dev/null 2>&1; then
        echo "PostgreSQL is ready."
        break
      fi
      if [ "$i" -eq 30 ]; then
        echo "WARNING: PostgreSQL health check timed out. Continuing anyway..."
      fi
      sleep 1
    done
  else
    echo "WARNING: Docker not found. Make sure PostgreSQL is running at $DATABASE_URL"
  fi

  # Create .env if it doesn't exist
  if [ ! -f apps/api/.env ]; then
    cat > apps/api/.env <<EOF
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DEPLOYMENT_MODE=${DEPLOYMENT_MODE}
DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=${DATABASE_SSL}
RUN_MIGRATIONS=${RUN_MIGRATIONS}

JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://localhost:5173
EOF
    echo "Created apps/api/.env"
  else
    echo "apps/api/.env already exists, skipping"
  fi

  # Run migrations
  echo "Running migrations..."
  pnpm --filter @context-sync/api migrate

  # Seed data
  echo "Loading seed data..."
  pnpm --filter @context-sync/api seed

  echo ""
  echo "Setup complete! Run: pnpm dev"
  echo "  API  → http://localhost:3001"
  echo "  Web  → http://localhost:5173"

else
  # Interactive mode
  echo "Select deployment mode:"
  echo "  1) personal    — Solo use (local DB)"
  echo "  2) team-host   — Host team DB (admin)"
  echo "  3) team-member — Join team (remote DB)"
  read -rp "Choice [1/2/3]: " mode_choice

  case $mode_choice in
    1) DEPLOYMENT_MODE="personal" ;;
    2) DEPLOYMENT_MODE="team-host" ;;
    3) DEPLOYMENT_MODE="team-member" ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac

  DATABASE_SSL="false"
  RUN_MIGRATIONS="true"

  if [ "$DEPLOYMENT_MODE" = "team-member" ]; then
    read -rp "Central DB URL (e.g. postgresql://team_member:pass@host:5432/contextsync): " DATABASE_URL
    DATABASE_SSL="true"
    RUN_MIGRATIONS="false"
  elif [ "$DEPLOYMENT_MODE" = "team-host" ]; then
    read -rp "DB external port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -rsp "DB admin password: " POSTGRES_PASSWORD
    echo ""
    DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${DB_PORT}/contextsync"
    DATABASE_SSL="true"
    RUN_MIGRATIONS="true"
  else
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contextsync"
  fi

  # Auto-generate JWT secret
  JWT_SECRET=$(openssl rand -base64 48)
  echo "JWT secret auto-generated."

  cat > apps/api/.env <<EOF
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DEPLOYMENT_MODE=${DEPLOYMENT_MODE}
DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=${DATABASE_SSL}
RUN_MIGRATIONS=${RUN_MIGRATIONS}

JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://localhost:5173
EOF

  echo ""
  echo "apps/api/.env created successfully"
  echo ""

  if [ "$DEPLOYMENT_MODE" = "personal" ]; then
    echo "Next steps:"
    echo "  docker compose up -d"
    echo "  pnpm --filter @context-sync/api migrate"
    echo "  pnpm dev"
  elif [ "$DEPLOYMENT_MODE" = "team-host" ]; then
    echo "Next steps:"
    echo "  1. Place SSL certs in docker/ssl/ (server.crt, server.key)"
    echo "  2. docker compose --profile team-host up -d"
    echo "  3. pnpm --filter @context-sync/api migrate"
    echo "  4. pnpm dev"
  else
    echo "Next steps:"
    echo "  pnpm dev"
  fi
fi
