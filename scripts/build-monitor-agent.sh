#!/usr/bin/env bash
# Build the TIBOSX Monitor desktop agent (Tauri).
#
# API URL is baked into the binary (not shown in the UI):
#   ./scripts/build-monitor-agent.sh --staging
#   ./scripts/build-monitor-agent.sh --api-url=https://your-api.example.com
#   MONITOR_API_URL=https://... ./scripts/build-monitor-agent.sh
#
# --staging reads MONITOR_API_URL_STAGING from apps/monitor-agent/.env (or other .env files).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="build"
TARGET=""
BUILD_ALL=0
WORKFLOW_REF=""
API_URL="${MONITOR_API_URL:-}"
USE_STAGING=0

# Read KEY=value from a dotenv file (last match wins). Strips optional quotes.
read_dotenv_key() {
  local key="$1"
  local file="$2"
  local line raw
  [ -f "$file" ] || return 1
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$file" | tail -n 1)" || return 1
  [ -n "$line" ] || return 1
  raw="${line#*=}"
  raw="${raw#"${raw%%[![:space:]]*}"}"
  raw="${raw%"${raw##*[![:space:]]}"}"
  if [[ "$raw" == \"*\" ]]; then
    raw="${raw:1:${#raw}-2}"
  elif [[ "$raw" == \'*\' ]]; then
    raw="${raw:1:${#raw}-2}"
  fi
  printf '%s' "$raw"
}

# Resolve MONITOR_API_URL_STAGING from process env, then common .env files.
resolve_staging_api_url() {
  if [ -n "${MONITOR_API_URL_STAGING:-}" ]; then
    printf '%s' "$MONITOR_API_URL_STAGING"
    return 0
  fi
  local file key_val
  for file in \
    "$ROOT_DIR/apps/monitor-agent/.env" \
    "$ROOT_DIR/.env" \
    "$ROOT_DIR/packages/api/.env" \
    "$ROOT_DIR/packages/database/.env" \
    "$ROOT_DIR/apps/admin/.env.local" \
    "$ROOT_DIR/apps/admin/.env"
  do
    if key_val="$(read_dotenv_key MONITOR_API_URL_STAGING "$file")"; then
      if [ -n "$key_val" ]; then
        printf '%s' "$key_val"
        return 0
      fi
    fi
  done
  return 1
}

ARGS=("$@")
i=0
while [ "$i" -lt "${#ARGS[@]}" ]; do
  arg="${ARGS[$i]}"
  case "$arg" in
    --dev|-d) MODE="dev" ;;
    --mac) TARGET="mac" ;;
    --win) TARGET="win" ;;
    --linux) TARGET="linux" ;;
    --all) BUILD_ALL=1 ;;
    --staging)
      USE_STAGING=1
      ;;
    --api-url=*)
      API_URL="${arg#--api-url=}"
      ;;
    --api-url)
      i=$((i + 1))
      API_URL="${ARGS[$i]:-}"
      if [ -z "$API_URL" ]; then
        echo "Error: --api-url requires a value" >&2
        exit 1
      fi
      ;;
    --ref=*)
      WORKFLOW_REF="${arg#--ref=}"
      ;;
    --ref)
      echo "Pass the branch as --ref=<branch>, e.g. --ref=staging" >&2
      exit 1
      ;;
    -h|--help)
      cat <<'EOF'
Build the TIBOSX Monitor agent.

Usage:
  ./scripts/build-monitor-agent.sh --staging
  ./scripts/build-monitor-agent.sh --staging --all
  ./scripts/build-monitor-agent.sh --api-url=https://api.example.com
  ./scripts/build-monitor-agent.sh --dev
  ./scripts/build-monitor-agent.sh --dev --staging
  ./scripts/build-monitor-agent.sh --mac --staging

--staging loads MONITOR_API_URL_STAGING from (first hit wins):
  apps/monitor-agent/.env
  .env
  packages/api/.env
  packages/database/.env
  apps/admin/.env.local / .env
  or the process env MONITOR_API_URL_STAGING

Copy apps/monitor-agent/.env.example → apps/monitor-agent/.env and set the URL.

--api-url overrides --staging when both are passed.
Dev builds default to http://localhost:3001 if no URL is set.
Release builds require --staging, --api-url, or MONITOR_API_URL.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
  i=$((i + 1))
done

if [ "$USE_STAGING" -eq 1 ] && [ -z "$API_URL" ]; then
  if ! API_URL="$(resolve_staging_api_url)"; then
    echo "Error: --staging needs MONITOR_API_URL_STAGING in .env" >&2
    echo "  Add to apps/monitor-agent/.env:" >&2
    echo "    MONITOR_API_URL_STAGING=https://techbubbleapi-staging.up.railway.app" >&2
    echo "  (see apps/monitor-agent/.env.example)" >&2
    exit 1
  fi
fi

API_URL="${API_URL%/}"
export MONITOR_API_URL="$API_URL"

if [ "$BUILD_ALL" -eq 1 ]; then
  if [ -z "$MONITOR_API_URL" ]; then
    echo "Error: --all requires --staging or --api-url=... (baked into every platform build)." >&2
    exit 1
  fi
  if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is required for --all." >&2
    echo "Install: https://cli.github.com/ then run: gh auth login" >&2
    exit 1
  fi

  REF="${WORKFLOW_REF:-}"
  if [ -z "$REF" ]; then
    REF="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo master)"
  fi

  echo "==> Triggering GitHub Actions monitor-agent builds on ref: $REF"
  echo "    MONITOR_API_URL=$MONITOR_API_URL"
  gh workflow run monitor-agent.yml --ref "$REF" -f api_url="$MONITOR_API_URL"

  echo
  echo "Workflow started. Watch / download artifacts with:"
  echo "  gh run list --workflow=monitor-agent.yml --limit 5"
  echo "  gh run watch"
  echo "  gh run download --dir ./dist/monitor-agent"
  exit 0
fi

if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

export PATH="${HOME}/.cargo/bin:${PATH}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "Error: cargo not found. Install Rust first:" >&2
  echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y" >&2
  echo "  source \"\$HOME/.cargo/env\"" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm not found. Install pnpm 9+ and retry." >&2
  exit 1
fi

if [ "$MODE" != "dev" ] && [ -z "$MONITOR_API_URL" ]; then
  echo "Error: release builds require an API URL." >&2
  echo "  ./scripts/build-monitor-agent.sh --staging" >&2
  echo "  ./scripts/build-monitor-agent.sh --api-url=https://your-api.example.com" >&2
  exit 1
fi

HOST_OS="$(uname -s)"
echo "==> Rust: $(rustc --version)"
echo "==> Cargo: $(cargo --version)"
echo "==> Host: $HOST_OS"
if [ -n "$MONITOR_API_URL" ]; then
  echo "==> MONITOR_API_URL=$MONITOR_API_URL (baked into binary)"
else
  echo "==> MONITOR_API_URL unset (dev default http://localhost:3001)"
fi
echo "==> Installing workspace deps (monitor-agent)…"
pnpm --filter @techbubble/monitor-agent install

if [ "$MODE" = "dev" ]; then
  echo "==> Starting monitor agent (tauri dev)…"
  exec pnpm --filter @techbubble/monitor-agent tauri:dev
fi

case "$TARGET" in
  mac)
    echo "==> Building macOS universal agent…"
    pnpm --filter @techbubble/monitor-agent tauri:build:mac
    ;;
  win)
    echo "==> Building Windows agent…"
    pnpm --filter @techbubble/monitor-agent tauri:build:win
    ;;
  linux)
    echo "==> Building Linux agent…"
    pnpm --filter @techbubble/monitor-agent tauri:build:linux
    ;;
  *)
    echo "==> Building monitor agent for this host only…"
    pnpm --filter @techbubble/monitor-agent tauri:build
    ;;
esac

BUNDLE_DIR="$ROOT_DIR/apps/monitor-agent/src-tauri/target/release/bundle"
INSTALLERS_DIR="$ROOT_DIR/apps/monitor-agent/installers"
# Cursor/sandbox builds may redirect cargo output via CARGO_TARGET_DIR — sync into the repo path.
if [ -n "${CARGO_TARGET_DIR:-}" ]; then
  SRC_BUNDLE="${CARGO_TARGET_DIR%/}/release/bundle"
  if [ -d "$SRC_BUNDLE" ] && [ "$SRC_BUNDLE" != "$BUNDLE_DIR" ]; then
    echo "==> Syncing artifacts from CARGO_TARGET_DIR → $BUNDLE_DIR"
    mkdir -p "$BUNDLE_DIR"
    rsync -a --delete "$SRC_BUNDLE/" "$BUNDLE_DIR/"
  fi
fi

# Publish installers to apps/monitor-agent/installers (stable path for handoff).
mkdir -p "$INSTALLERS_DIR/macos" "$INSTALLERS_DIR/windows" "$INSTALLERS_DIR/linux"
copy_installers_from() {
  local src="$1"
  local dest="$2"
  shift 2
  [ -d "$src" ] || return 0
  local f
  while IFS= read -r -d '' f; do
    cp -f "$f" "$dest/"
  done < <(find "$src" -maxdepth 1 \( "$@" \) -print0 2>/dev/null)
}
if [ -d "$BUNDLE_DIR" ]; then
  echo "==> Copying installers → $INSTALLERS_DIR"
  # Only package installers (.dmg/.msi/…), never raw .app — Launchpad indexes every .app on disk.
  copy_installers_from "$BUNDLE_DIR/dmg" "$INSTALLERS_DIR/macos" -name "*.dmg"
  copy_installers_from "$BUNDLE_DIR/msi" "$INSTALLERS_DIR/windows" -name "*.msi"
  copy_installers_from "$BUNDLE_DIR/nsis" "$INSTALLERS_DIR/windows" -name "*.exe"
  copy_installers_from "$BUNDLE_DIR/deb" "$INSTALLERS_DIR/linux" -name "*.deb"
  copy_installers_from "$BUNDLE_DIR/appimage" "$INSTALLERS_DIR/linux" -name "*.AppImage"
  # Drop any leftover .app copies from older builds.
  rm -rf "$INSTALLERS_DIR/macos/"*.app
fi

echo
echo "Build finished."
echo "Installers: $INSTALLERS_DIR"
echo "  (Tauri raw bundle still at $BUNDLE_DIR)"
find "$INSTALLERS_DIR" -maxdepth 2 \( -name "*.app" -o -name "*.dmg" -o -name "*.msi" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" \) -print 2>/dev/null || true

