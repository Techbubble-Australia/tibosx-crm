# Scripts

## Monitor agent

```bash
source "$HOME/.cargo/env"   # if cargo is not on PATH yet

# Bake staging API URL from apps/monitor-agent/.env (MONITOR_API_URL_STAGING)
./scripts/build-monitor-agent.sh --staging

# Or pass URL explicitly
./scripts/build-monitor-agent.sh --api-url=https://techbubbleapi-staging.up.railway.app

# Dev (defaults to http://localhost:3001 if no URL)
./scripts/build-monitor-agent.sh --dev
./scripts/build-monitor-agent.sh --dev --staging

# macOS + Windows + Linux via GitHub Actions
./scripts/build-monitor-agent.sh --all --staging
```

Set `MONITOR_API_URL_STAGING` in `apps/monitor-agent/.env` (see `.env.example`).

Installers land in:

`apps/monitor-agent/src-tauri/target/release/bundle/`  
(`.dmg` / `.app` — not `apps/monitor-agent/dist`, which is only the Vite web UI)
