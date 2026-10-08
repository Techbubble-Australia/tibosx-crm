#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v railway >/dev/null 2>&1; then
  echo "Error: Railway CLI is not installed. Install it with: npm install -g @railway/cli"
  exit 1
fi

TEMP_RAILWAY_TOML="$ROOT_DIR/railway.toml"
BACKUP_RAILWAY_TOML="$ROOT_DIR/.railway.toml.bak"

cleanup() {
  if [ -f "$BACKUP_RAILWAY_TOML" ]; then
    mv "$BACKUP_RAILWAY_TOML" "$TEMP_RAILWAY_TOML"
  else
    rm -f "$TEMP_RAILWAY_TOML"
  fi
}
trap cleanup EXIT

if [ -f "$TEMP_RAILWAY_TOML" ]; then
  cp "$TEMP_RAILWAY_TOML" "$BACKUP_RAILWAY_TOML"
fi

deploy_service() {
  local service="$1"
  local config_file="$2"

  echo "\n==> Deploying $service using $config_file"
  cp "$ROOT_DIR/$config_file" "$TEMP_RAILWAY_TOML"
  railway up --service "$service" --ci
}

case "${1:-all}" in
  all)
    deploy_service "api" "railway.api.toml"
    deploy_service "web" "railway.web.toml"
    deploy_service "admin" "railway.admin.toml"
    deploy_service "ticketing" "railway.ticketing.toml"
    echo "\nAll Railway services deployed successfully."
    ;;
  api)
    deploy_service "api" "railway.api.toml"
    ;;
  web)
    deploy_service "web" "railway.web.toml"
    ;;
  admin)
    deploy_service "admin" "railway.admin.toml"
    ;;
  ticketing)
    deploy_service "ticketing" "railway.ticketing.toml"
    ;;
  *)
    echo "Usage: $0 [all|api|web|admin|ticketing]"
    exit 1
    ;;
esac
