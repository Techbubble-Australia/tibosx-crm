# Client ticketing portal

Separate support product: **Next.js portal** (`apps/ticketing`), **Express API** (`packages/ticketing-api`), and **PostgreSQL** (`packages/ticketing-database` via `TICKETING_DATABASE_URL`).

## Features

- **Multi-tenant organizations** — client users only see tickets for their organization.
- **Ticket types** — technical, financial/loan, internal/external service.
- **Workflow** — Open → In progress → Pending client → Resolved → Closed; priorities Low–Urgent.
- **Messages** — client-visible thread; consultants can add **internal** notes.
- **Attachments** — metadata + URL (wire upload to TBOS object storage in a follow-up).
- **Audit log** — consultant-visible history on each ticket.
- **RBAC** — `CLIENT` (org-scoped) vs verified `CONSULTANT` (all orgs).
- **TBOS SSO** — header **Support portal** link for `admin` / `sales` (configurable) opens the portal with a ticketing session.

## Local setup

1. Create a **second** Postgres database and set:

   ```bash
   # packages/ticketing-database/.env or root .env
   TICKETING_DATABASE_URL="postgresql://user:pass@localhost:5432/techbubble_ticketing"
   ```

2. Migrate and seed:

   ```bash
   pnpm --filter @techbubble/ticketing-database db:generate
   pnpm --filter @techbubble/ticketing-database db:deploy
   pnpm --filter @techbubble/ticketing-database db:seed
   ```

3. Run services:

   ```bash
   pnpm --filter @techbubble/ticketing-api dev    # :3003
   pnpm --filter @techbubble/ticketing dev        # :3004
   ```

4. Seed logins (override via env in seed):

   - Client: `client@acme-demo.example` / `ClientDemo123!`
   - Consultant: `consultant@techbubble.com.au` / `ConsultantDemo123!`

5. TBOS (`apps/admin`): set `TICKETING_API_URL` and `NEXT_PUBLIC_TICKETING_PORTAL_URL`, use **Support portal** in the top bar.

## Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `TICKETING_DATABASE_URL` | ticketing-api | Dedicated DB |
| `TICKETING_JWT_SECRET` | ticketing-api, ticketing app | Session JWT (defaults to `JWT_SECRET`) |
| `TICKETING_API_URL` | ticketing app, TBOS | API base |
| `TICKETING_ALLOWED_ORIGINS` | ticketing-api | CORS |
| `TICKETING_TBOS_CONSULTANT_ROLES` | ticketing-api, TBOS | Who may SSO from TBOS |

## Railway deployment

The monorepo did **not** ship ticketing until `railway.ticketing.toml` and `railway.ticketing-api.toml` were added. You need **two new Railway services** (plus a Postgres plugin for ticketing).

### 1. Postgres for ticketing

- Add a **new** PostgreSQL service (or database) in the same Railway project.
- Copy its `DATABASE_URL` into the variable **`TICKETING_DATABASE_URL`** on the **ticketing-api** service (not `DATABASE_URL` for the main TBOS API).

### Railway “Root Directory” (important)

Ticketing code lives under **`packages/ticketing-api`** and **`apps/ticketing`**, but Railway must still use **Root Directory = `/`** (repository root).

The UI list item **`ticketing-api /`** is a **service label**, not a folder to deploy from. If you set Root Directory to `ticketing-api` or `packages/ticketing-api`, the build will not find `Dockerfile.ticketing-api`, `pnpm-lock.yaml`, or workspace packages — deploys fail or never start.

For **every** ticketing service (API + portal):

| Setting | Value |
|--------|--------|
| **Root Directory** | `/` (empty or repo root) |
| **Config file** | `railway.ticketing-api.toml` or `railway.ticketing.toml` |
| **Service name** | `ticketing-api` / `ticketing` (name only; not the root path) |

### 2. Service: `ticketing-api`

- Create a service named **`ticketing-api`** (name must match `scripts/railway-deploy-all.sh`).
- **Settings → Config file:** `railway.ticketing-api.toml` (or set Dockerfile path to `Dockerfile.ticketing-api`).
- **Root directory:** **`/`** — do **not** pick `ticketing-api` from the Root Directory dropdown.
- **Variables:**
  - `TICKETING_DATABASE_URL` — from ticketing Postgres
  - `JWT_SECRET` — **same value as TBOS API** (for SSO)
  - `TICKETING_ALLOWED_ORIGINS` — public portal URL + TBOS admin URL, comma-separated  
    e.g. `https://your-ticketing.up.railway.app,https://your-admin.up.railway.app`
- Deploy: `pnpm run deploy:railway:ticketing-api`
- Generate a **public domain**; note the URL (e.g. `https://ticketing-api-xxx.up.railway.app`).

### 3. Service: `ticketing` (portal UI)

- Create a service named **`ticketing`**.
- **Config file:** `railway.ticketing.toml` / `Dockerfile.ticketing` (optional if using root `Dockerfile`).
- **Start command:** `node apps/ticketing/server.js` (do **not** use `pnpm start` / port **3004** — that is local dev only).
- **Variables:**
  - `TICKETING_API_URL` — **public https** URL of ticketing-api, e.g. `https://ticketing-api-xxx.up.railway.app` (not `:3003` and not `127.0.0.1`)
  - `JWT_SECRET` — same as TBOS / ticketing-api
- **Do not set `PORT=3004`** on Railway. The platform assigns `PORT`; the container must listen on that value.
- Deploy: `pnpm run deploy:railway:ticketing`
- Generate a **public domain** for the portal (e.g. `https://ticketing-xxx.up.railway.app`).

### 4. TBOS admin (existing service)

On the **admin** service, set:

- `TICKETING_API_URL` — public ticketing-api URL
- `NEXT_PUBLIC_TICKETING_PORTAL_URL` — public portal URL (for SSO redirect)

Redeploy admin after setting these. Use **Support portal** in the TBOS header (admin/sales roles).

### 5. Seed (once)

Run seed against production DB (locally with `TICKETING_DATABASE_URL` pointing at Railway, or Railway one-off command):

```bash
pnpm --filter @techbubble/ticketing-database db:seed
```

### Troubleshooting

| Symptom | Check |
|--------|--------|
| `/health` shows **Client Support Portal** login | That domain runs the **portal** (Next.js), not ticketing-api. API must use `Dockerfile.ticketing-api` on its own service; `/health` must return `"service":"ticketing-api"`. Portal `/health` returns `"service":"ticketing-portal"`. |
| Deploy stuck / no build when selecting `ticketing-api` folder | Set **Root Directory** back to **`/`**. Use **Config file** `railway.ticketing-api.toml` + **Dockerfile** `Dockerfile.ticketing-api` from repo root. |
| Wrong app / API image on deploy | **API / admin / web / ticketing-api** must set **Config file** to the matching `railway.*.toml`. The root `Dockerfile` builds the **ticketing portal** only (for services without a config file). |
| Build fails with `npm ci` / missing `package-lock.json` | Old root Dockerfile; pull latest. Portal builds use **pnpm** via root `Dockerfile` or `Dockerfile.ticketing`. |
| Portal 404 / nothing deployed | Separate **`ticketing`** service with `Dockerfile.ticketing`, not admin/web |
| Login fails | `TICKETING_API_URL` on portal service; API healthy at `/health` |
| SSO from TBOS fails / HTTP 500 on `/api/ticketing/launch` | On **admin**: set `TICKETING_API_URL` to public ticketing-api URL (not unset / not `127.0.0.1:3003`). `JWT_SECRET` on ticketing-api must match **TBOS API** (`packages/api`). `NEXT_PUBLIC_TICKETING_PORTAL_URL` = portal origin only (`https://…`), not `…/login`. Redeploy admin after env changes. |
| API crash on boot | `TICKETING_DATABASE_URL` set; migrations run via start script |
| **Application failed to respond** (Railway edge) | Remove custom `PORT` (3003/3004). Redeploy with latest Docker image (`HOSTNAME=0.0.0.0`). Check deploy logs: process must run `node apps/ticketing/server.js`. |
