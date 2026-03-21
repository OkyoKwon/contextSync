#!/bin/sh
# Generate self-signed SSL certificates for team-host PostgreSQL
# These are for development/internal use. Replace with CA-signed certs for production.

set -e

SSL_DIR="${1:-./docker/ssl}"

if [ -f "$SSL_DIR/server.crt" ] && [ -f "$SSL_DIR/server.key" ]; then
  echo "SSL certificates already exist in $SSL_DIR — skipping generation."
  exit 0
fi

mkdir -p "$SSL_DIR"

echo "Generating self-signed SSL certificate in $SSL_DIR..."

openssl req -new -x509 -days 365 -nodes \
  -subj "/CN=contextsync-postgres" \
  -keyout "$SSL_DIR/server.key" \
  -out "$SSL_DIR/server.crt" \
  2>/dev/null

# PostgreSQL requires specific permissions on the key file
chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

echo "SSL certificates generated successfully."
