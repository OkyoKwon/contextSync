#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR=22
CURRENT=$(node -v 2>/dev/null || echo "none")

if [ "$CURRENT" = "none" ]; then
  echo "ERROR: Node.js not found. Install Node.js $REQUIRED_MAJOR+ first."
  exit 1
fi

MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')

if [ "$MAJOR" -lt "$REQUIRED_MAJOR" ]; then
  echo ""
  echo "ERROR: Node.js $REQUIRED_MAJOR+ required (current: $CURRENT)"
  echo ""
  echo "Fix:"
  echo "  nvm use $REQUIRED_MAJOR    # .nvmrc exists in project root"
  echo ""
  exit 1
fi
