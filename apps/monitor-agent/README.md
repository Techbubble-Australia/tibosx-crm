# TIBOSX Monitor Agent

Desktop agent (Tauri 2) that enrolls with an active AdminUser email, then runs in the background capturing screenshots on the interval configured in Admin → **Monitoring settings**.

## Prerequisites

- Node.js 20+ and pnpm 9+
- [Rust toolchain](https://rustup.rs/) (stable)
- Platform deps for Tauri:
  - **macOS:** Xcode CLI tools
  - **Windows:** Visual Studio C++ build tools, WebView2
  - **Linux:** `webkit2gtk`, `libayatana-appindicator`, build essentials (see [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/))

## Configure API

Bake the API base URL in at **build** time (`MONITOR_API_URL` / `--api-url`). The enroll UI only asks for work email. Credentials are stored under the OS app data directory (`tibosx-monitor-agent/credentials.json`).

Enable monitoring in Admin (**Platform → Monitoring settings**) or the agent will heartbeat but skip uploads.

## Develop

```bash
# from repo root
pnpm install
pnpm --filter @techbubble/monitor-agent install

# run API locally, then:
pnpm --filter @techbubble/monitor-agent tauri:dev
```

## Build executables

The API base URL is **not** shown in the UI. Bake it in at build time:

```bash
# from repo root — reads MONITOR_API_URL_STAGING from apps/monitor-agent/.env
./scripts/build-monitor-agent.sh --staging
./scripts/build-monitor-agent.sh --dev --staging
./scripts/build-monitor-agent.sh --all --staging

# or pass explicitly
./scripts/build-monitor-agent.sh --api-url=https://techbubbleapi-staging.up.railway.app
```

Copy `.env.example` → `.env` and set `MONITOR_API_URL_STAGING`. Dev builds default to `http://localhost:3001` if no URL is set.

Installers: `apps/monitor-agent/src-tauri/target/release/bundle/` (not `dist/`).

## Permissions

- **macOS:** Screen Recording must be allowed for **TIBOSX Monitor**. The app blocks with a message until a capture probe succeeds and can open System Settings.
- **Windows:** No special toggle in most setups; failures surface in the UI.
- **Linux:** Wayland may require an xdg-desktop-portal screenshot grant; X11 usually works without extra prompts.

## API contract

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/monitor/enroll` | none (email must match active AdminUser) |
| GET | `/api/monitor/config` | device Bearer token |
| POST | `/api/monitor/heartbeat` | device Bearer token |
| POST | `/api/monitor/screenshot` | device Bearer token (multipart `image`) |
| POST | `/api/monitor/session/end` | device Bearer token |

Admin review: `/monitoring` · Settings: `/settings/monitoring`.
