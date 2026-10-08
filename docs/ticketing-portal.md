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

## Production

Deploy three additional units (or combine API with portal): ticketing DB, `ticketing-api`, `apps/ticketing`. Align `JWT_SECRET` / `TICKETING_JWT_SECRET` with TBOS for SSO.
