# Client ticketing portal

Support product: **Next.js portal** (`apps/ticketing`) and **TBOS API** (`packages/api`) sharing the **main PostgreSQL** database (`packages/database`). Ticketing routes live under `/api/ticketing/*` (portal) and `/api/admin/ticketing/*` (TBOS).

## Features

- **TBOS Support tickets** — Project Management → **Support tickets** lists tickets (admin: all projects; sales: assigned projects only). **Support projects** (admin) creates portal projects; **Consultant access** assigns projects per consultant.
- **File uploads** — Clients attach files when creating tickets or on the ticket detail page. Uses the same storage as TBOS: **`OBJECT_STORAGE_*`** (Railway bucket) when set, otherwise disk under **`UPLOAD_DIR`/tickets** (API image pre-creates `/app/uploads/tickets`). Set **`TICKETING_PUBLIC_URL`** on the **main API** for attachment URLs in production if needed.
- **Multi-tenant projects** — each client **support project** is an `Organization` (not the same as TBOS CRM clients). An org may optionally link to a TBOS **delivery** `Project` via `Organization.projectId` (created automatically when you create a project from a contract, or via **Enable support portal** on the project page / **Support projects** in admin). Client users only see tickets for their org.
- **Ticket types** — technical, financial/loan, internal/external service.
- **Workflow** — Open → In progress → Pending client → Resolved → Closed; priorities Low–Urgent.
- **Messages** — client-visible thread; consultants can add **internal** notes.
- **Attachments** — metadata + URL (same object storage as TBOS).
- **Audit log** — consultant-visible history on each ticket.
- **RBAC** — `CLIENT` (org-scoped) vs verified `CONSULTANT` (all orgs).
- **TBOS SSO** — header **Support portal** link for `admin` / `sales` (configurable) opens the portal with a ticketing session.

## Local setup

1. Use the main TBOS database (`DATABASE_URL`) and apply migrations:

   ```bash
   pnpm --filter @techbubble/database db:deploy
   pnpm --filter @techbubble/database db:seed:support-ticketing
   ```

2. Run services:

   ```bash
   pnpm --filter @techbubble/api dev              # :3001
   pnpm --filter @techbubble/ticketing dev        # :3004
   pnpm --filter @techbubble/admin dev            # :3002
   ```

3. Seed logins (override via env in seed):

   - Client: `client@acme-demo.example` / `ClientDemo123!`
   - Consultant: `consultant@techbubble.com.au` / `ConsultantDemo123!`

4. TBOS (`apps/admin`): set `API_URL` (main API), `NEXT_PUBLIC_TICKETING_PORTAL_URL`, use **Support portal** in the top bar.

## Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | API | Main Postgres (includes ticketing tables) |
| `JWT_SECRET` | API, admin, portal | TBOS session + ticketing JWT (must match) |
| `API_URL` | admin, portal | Main API base (server-side proxies) |
| `TICKETING_JWT_SECRET` | API, portal | Optional override for portal session JWT (defaults to `JWT_SECRET`) |
| `TICKETING_ALLOWED_ORIGINS` | API | CORS for portal + admin origins |
| `TICKETING_TBOS_CONSULTANT_ROLES` | API, admin | Who may SSO from TBOS |
| `NEXT_PUBLIC_TICKETING_PORTAL_URL` | admin | Portal origin for SSO redirect (no `/login` suffix) |

## Railway deployment

You need the **existing TBOS API** service plus a **`ticketing`** portal service. Use **one** Postgres (`DATABASE_URL` on the API only). You can **remove** any legacy standalone `ticketing-api` service and separate ticketing Postgres after migrating data (if you had any).

### API service (`api`)

- Same as TBOS: `railway.api.toml`, `DATABASE_URL`, `JWT_SECRET`, migrations on start.
- Ensure ticketing migrations are deployed (`db:deploy` / API start script).
- Copy **`OBJECT_STORAGE_*`** from production if you use a bucket; ticket files use `uploads/tickets/`.
- Optional: `TICKETING_ALLOWED_ORIGINS` — portal and admin public URLs, comma-separated.

### Portal service (`ticketing`)

- **Config file:** `railway.ticketing.toml` / `Dockerfile.ticketing` (root `Dockerfile` also builds the portal).
- **Root directory:** `/` (repo root).
- **Start command:** `node apps/ticketing/server.js` (do **not** use `pnpm start` / port **3004** on Railway).
- **Variables:**
  - `API_URL` — **public https** URL of the **main TBOS API**, e.g. `https://your-api.up.railway.app`
  - `JWT_SECRET` — same as TBOS API
- **Do not set `PORT=3004`** on Railway; listen on the platform-assigned `PORT`.
- Deploy: `pnpm run deploy:railway:ticketing`
- `/health` returns `"service":"ticketing-portal"`.

### TBOS admin (existing service)

- `API_URL` — public main API URL
- `NEXT_PUBLIC_TICKETING_PORTAL_URL` — public portal URL (for SSO redirect)

Redeploy admin after env changes. Use **Support portal** in the TBOS header (admin/sales roles).

### Support projects and consultants (TBOS)

| Task | Where in TBOS |
|------|----------------|
| Create a support **project** | **Project Management → Support tickets → Support projects** → Add project (admin) |
| Link to delivery project | Project detail → **Enable support portal**, or Support projects → link TBOS project |
| Assign projects to a **sales consultant** | **Support tickets → Consultant access** |
| Create consultant (staff) | **Users** → role `sales` or `admin` → first **Support portal** SSO provisions ticketing account |
| Create **client** portal login | Seed / DB (`CLIENT` user + `organizationId`)—no TBOS form yet |

### Seed (once)

```bash
pnpm --filter @techbubble/database db:seed:support-ticketing
```

### Troubleshooting

| Symptom | Check |
|--------|--------|
| Login fails | `API_URL` on portal points at main API; API healthy at `/health` |
| SSO from TBOS fails | `API_URL` on admin; `JWT_SECRET` matches API; `NEXT_PUBLIC_TICKETING_PORTAL_URL` = portal origin only |
| 404 on `/api/ticketing/*` | Redeploy API with latest code; migrations applied |
| **Application failed to respond** (portal) | Remove custom `PORT` (3004). Use `node apps/ticketing/server.js`. |
