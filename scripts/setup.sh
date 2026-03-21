#!/usr/bin/env bash
set -euo pipefail

echo "=== ContextSync Setup ==="
echo ""
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

# GitHub OAuth (common)
read -rp "GitHub Client ID: " GITHUB_CLIENT_ID
read -rp "GitHub Client Secret: " GITHUB_CLIENT_SECRET
read -rsp "JWT Secret (min 32 chars): " JWT_SECRET
echo ""

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "ERROR: JWT Secret must be at least 32 characters"
  exit 1
fi

cat > apps/api/.env <<EOF
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DEPLOYMENT_MODE=${DEPLOYMENT_MODE}
DATABASE_URL=${DATABASE_URL}
DATABASE_SSL=${DATABASE_SSL}
RUN_MIGRATIONS=${RUN_MIGRATIONS}

GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
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
