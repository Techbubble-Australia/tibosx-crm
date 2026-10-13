# Support workspace (TBOS)

Client and customer-support ticketing and timesheets run **inside TBOS** (`apps/admin`) at `/workspace/*`, backed by the main API (`packages/api`) and shared Postgres (`packages/database`).

## Architecture

| Surface | Path | Who |
|--------|------|-----|
| Workspace UI | `apps/admin` → `/workspace/dashboard`, `/workspace/tickets`, `/workspace/timesheets` | `client`, `customer_support` |
| Workspace API | `/api/admin/workspace/*` (TBOS session + MFA) | Same roles |
| Admin ticketing | `/support-tickets` → `/api/admin/ticketing/*` | `admin` (and roles with workspace module as configured) |

Ticketing domain logic lives in `packages/api/src/ticketing/`. Legacy `/api/ticketing/*` routes remain on the API for backward compatibility but are no longer used by a separate portal app.

## Local development

1. Database (includes ticketing tables):

   ```bash
   pnpm --filter @techbubble/database db:migrate
   pnpm --filter @techbubble/database db:seed:support-ticketing   # optional demo users
   ```

2. API and admin:

   ```bash
   pnpm --filter @techbubble/api dev      # :3001
   pnpm --filter @techbubble/admin dev    # :3002
   ```

3. Log in as a **client** or **customer_support** TBOS user → lands on `/workspace/dashboard`.

## Environment

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | API | Main Postgres |
| `JWT_SECRET` | API, admin | TBOS session (must match) |
| `ADMIN_PUBLIC_URL` / `NEXT_PUBLIC_ADMIN_URL` | API, admin | Links in emails (`/workspace/timesheets`, `/support-tickets/...`) |
| `API_URL` | admin | Server-side proxy to API |
| `TICKETING_PUBLIC_URL` | API | Optional public base for ticket attachment URLs when not using object storage |
| `OBJECT_STORAGE_*` | API | Preferred ticket attachment storage |

## Railway

Deploy **api**, **admin**, and **web** only (`pnpm run deploy:railway` or per-service scripts). Remove any legacy **ticketing** portal service from the project.

- API: `railway.api.toml` / `Dockerfile.api`
- Admin: `railway.admin.toml` / `Dockerfile.admin`

Ensure `ADMIN_PUBLIC_URL` on the API matches the public TBOS admin URL.

## Troubleshooting

| Issue | Check |
|-------|--------|
| Workspace 403 | User role is `client` or `customer_support`; MFA enrolled |
| Tickets empty / wrong org | Client contact linked to ticketing user; org scoping in API |
| Email links wrong host | `ADMIN_PUBLIC_URL` on API service |
