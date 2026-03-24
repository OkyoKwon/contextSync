#!/usr/bin/env bash
set -euo pipefail

DEFAULTS=false
NO_START=false
NODE_CHANGED=false
for arg in "$@"; do
  case $arg in
    --defaults) DEFAULTS=true ;;
    --no-start) NO_START=true ;;
  esac
done

echo "=== ContextSync Setup ==="
echo ""

# ── Node.js 22 auto-install via nvm ─────────────────────────────────────
load_nvm() {
  if type nvm &>/dev/null; then return 0; fi
  local nvm_dirs=("${NVM_DIR:-}" "$HOME/.nvm")
  if command -v brew &>/dev/null; then
    local brew_nvm
    brew_nvm="$(brew --prefix nvm 2>/dev/null)" && nvm_dirs+=("$brew_nvm")
  fi
  for dir in "${nvm_dirs[@]}"; do
    if [ -n "$dir" ] && [ -s "$dir/nvm.sh" ]; then
      source "$dir/nvm.sh"
      return 0
    fi
  done
  return 1
}

install_nvm() {
  echo "nvm not found. Installing nvm..."
  if ! command -v curl &>/dev/null; then
    echo "ERROR: curl is required to install nvm. Install curl and try again."
    exit 1
  fi
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
}

ensure_node_22() {
  local need_install=false
  if ! command -v node &>/dev/null; then
    need_install=true
  else
    local major
    major=$(node -e 'console.log(process.versions.node.split(".")[0])')
    if [ "$major" -lt 22 ]; then
      echo "Node.js $(node -v) detected (22+ required)."
      need_install=true
    fi
  fi

  if [ "$need_install" = false ]; then return 0; fi

  # Load nvm, install if missing
  if ! load_nvm; then
    install_nvm
  fi

  echo "Installing Node.js 22 via nvm..."
  nvm install 22
  nvm use 22
  nvm alias default 22
  NODE_CHANGED=true

  # Re-activate corepack for the new Node version
  corepack enable

  # Verify
  local major
  major=$(node -e 'console.log(process.versions.node.split(".")[0])')
  if [ "$major" -lt 22 ]; then
    echo "ERROR: Node.js 22 installation failed. Please install manually: nvm install 22"
    exit 1
  fi
  echo "Node.js $(node -v) activated."
}

ensure_node_22

# ── Kill stale dev servers on default ports ─────────────────────────────
for port in 5173 3001; do
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing stale process on port $port (PID: $pid)"
    kill "$pid" 2>/dev/null || true
  fi
done

start_dev_server() {
  echo ""
  if [ "$NO_START" = true ]; then
    echo "Setup complete!"
    echo ""
    echo "  Start dev server:"
    echo "    pnpm dev"
  else
    echo "Setup complete! Starting dev server..."
  fi
  echo ""
  echo "  API  → http://localhost:3001"
  echo "  Web  → http://localhost:5173"
  echo ""
  if [ "$NO_START" = false ]; then
    exec pnpm dev
  fi
}

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Activating pnpm via corepack..."
  corepack enable
  if ! command -v pnpm &>/dev/null; then
    echo "ERROR: pnpm is required. Run: corepack enable && corepack prepare pnpm@latest --activate"
    exit 1
  fi
fi

if [ "$DEFAULTS" = true ]; then
  # Non-interactive: personal mode with all defaults
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contextsync"
  DATABASE_SSL="false"
  RUN_MIGRATIONS="true"
  JWT_SECRET=$(openssl rand -base64 48)

  echo "Mode: personal (default)"
  echo ""

  # Install dependencies
  echo "Installing dependencies..."
  pnpm install

  # Create or update .env (before Docker, so it exists even if Docker fails)
  if [ ! -f apps/api/.env ]; then
    cat > apps/api/.env <<EOF
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=${DATABASE_SSL}
RUN_MIGRATIONS=${RUN_MIGRATIONS}

JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://localhost:5173
EOF
    echo "Created apps/api/.env"
  else
    # .env exists — ensure DATABASE_URL points to local postgres (personal mode)
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" apps/api/.env
    sed -i '' "s|^DATABASE_SSL=.*|DATABASE_SSL=${DATABASE_SSL}|" apps/api/.env
    echo "Updated .env: DATABASE_URL → local postgres"
  fi

  # Docker check + start (postgres service only — avoids team-host variable interpolation)
  if command -v docker &>/dev/null; then
    echo "Starting PostgreSQL with Docker..."
    docker compose up -d postgres

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

  # Run migrations
  echo "Running migrations..."
  pnpm --filter @context-sync/api migrate

  # Seed data
  echo "Loading seed data..."
  pnpm --filter @context-sync/api seed

  start_dev_server

else
  # Interactive mode
  echo "Select setup mode:"
  echo "  1) personal — Solo use (local DB)"
  echo "  2) team     — Team use (cloud DB)"
  read -rp "Choice [1/2]: " mode_choice

  DATABASE_SSL="false"
  RUN_MIGRATIONS="true"

  case $mode_choice in
    1)
      DATABASE_URL="postgresql://postgres:postgres@localhost:5432/contextsync"
      ;;
    2)
      read -rp "Cloud DB URL (e.g. postgresql://user:pass@host:5432/dbname): " DATABASE_URL
      DATABASE_SSL="true"
      RUN_MIGRATIONS="true"
      ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac

  # Auto-generate JWT secret
  JWT_SECRET=$(openssl rand -base64 48)
  echo "JWT secret auto-generated."

  cat > apps/api/.env <<EOF
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=${DATABASE_SSL}
RUN_MIGRATIONS=${RUN_MIGRATIONS}

JWT_SECRET=${JWT_SECRET}
FRONTEND_URL=http://localhost:5173
EOF

  echo ""
  echo "apps/api/.env created successfully"
  echo ""

  # Install dependencies
  echo "Installing dependencies..."
  pnpm install

  if [ "$mode_choice" = "1" ]; then
    # Docker check + start
    if command -v docker &>/dev/null; then
      echo "Starting PostgreSQL with Docker..."
      docker compose up -d postgres
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

    # Migrations + seed
    echo "Running migrations..."
    pnpm --filter @context-sync/api migrate
    echo "Loading seed data..."
    pnpm --filter @context-sync/api seed

    start_dev_server
  else
    # Team mode: migrations only (no Docker needed, seed skipped — not meaningful for remote DB)
    echo "Running migrations..."
    pnpm --filter @context-sync/api migrate

    start_dev_server
  fi
fi
