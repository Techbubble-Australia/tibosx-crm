# AGENTS.md — TIBOSX CRM / TechBubble monorepo

Read this file fully before making changes. This repo is the **TIBOSX CRM product line**, spun out from the TechBubble website monorepo staging line.

## What this project is

- **Product:** TIBOSX (admin CRM / operations platform) + marketing site + debug ticket portal.
- **Canonical GitHub repo for this product:** https://github.com/Techbubble-Australia/tibosx-crm.git
- **Origin of the code:** forked from `staging` of https://github.com/Techbubble-Australia/techbubble-website.git (commit family around `f8df278`).
- **Do not** merge this line back into `techbubble-website` `development` / `master` unless the user explicitly asks.
- **Do not** edit any `proprly-api` project if it appears in the workspace — it is restricted.

## Remotes & branches

| Remote | URL | Role |
|--------|-----|------|
| `tibosx-crm` | `https://github.com/Techbubble-Australia/tibosx-crm.git` | **This product’s repo** |
| `origin` (if present) | `https://github.com/Techbubble-Australia/techbubble-website.git` | Legacy monorepo — leave `development` / `master` pointing here |

On **tibosx-crm**:
- `master` — primary branch (seeded from staging snapshot)
- `staging` — same lineage; use for staging deploys

When working for the CRM product, prefer pushing to **`tibosx-crm`**, not `techbubble-website`, unless the user says otherwise.

## Monorepo layout

```
apps/
  admin/           # Next.js TBOS admin (CRM UI) — typically :3002
  web/             # Next.js marketing site — :3000
  debug-portal/    # Next.js debug ticket board — separate Railway service
packages/
  api/             # Express API — :3001
  database/        # Prisma schema + migrations
  config/          # Shared TS/ESLint/Tailwind config
  ui/              # Shared UI (limited use)
```

Package manager: **pnpm** (workspace). Builds: **turbo**.

### Key Docker / Railway entrypoints

- `Dockerfile.api` + `railway.api.toml`
- `Dockerfile.admin` + `railway.admin.toml`
- `Dockerfile.web` + `railway.web.toml`
- `Dockerfile.debug-portal` + `railway.debug-portal.toml`

## Runtime ports (local)

| App | Port |
|-----|------|
| web | 3000 |
| api | 3001 |
| admin | 3002 |

## Database

- Prisma in `packages/database/prisma/schema.prisma`
- Migrations in `packages/database/prisma/migrations/` (~102 migrations)
- Latest notable migrations:
  - `20261125090000_crm_v1_multi_tenant` — CRM v1 multi-tenant
  - `20261127090000_mfa_optional_default_off` — MFA default off for customers; clears MFA flags
- Commands (from repo root or filter):
  - `pnpm --filter @techbubble/database exec prisma migrate deploy`
  - `pnpm --filter @techbubble/database db:generate`
- Scripts:
  - `packages/database/scripts/disable-all-mfa.ts` — set MFA off for all users (`CONFIRM_DISABLE_ALL_MFA=1`)
  - `packages/database/scripts/check-user-mfa.ts` — inspect a user’s MFA flags

### Local `.env` labels (packages/database/.env)

| Host | Label in comments |
|------|-------------------|
| `nozomi.proxy.rlwy.net` | staging |
| `junction.proxy.rlwy.net` | development |
| `shortline.proxy.rlwy.net` | production |

**Always confirm which DB a Railway service uses before mutating data.** Staging Railway DB public proxy is **nozomi**.

## Auth & MFA (important product decisions)

MFA is **optional per user**, driven by DB flags (`mfaEnabled`, `totpSecretEnc`), not by hard-coded “always require” for customers.

### Login behaviour (`packages/api/src/routes/auth.ts`)

1. Password check
2. If `mfaEnabled && totpSecretEnc` → MFA challenge (`requiresMfa`)
3. If `mfaEnabled && !totpSecretEnc` → MFA setup (`requiresMfaSetup`)
4. Else → full session (password only)

### Enforcement

- `packages/api/src/middleware/requireMfaEnrolled.ts` — blocks only when MFA is **on** but enrollment incomplete
- `/api/auth/me` sets `requiresMfaEnrollment` from the same rules
- Admin middleware redirects to `/mfa-setup` only for `mfa_setup_required` JWT purpose
- New users (admin + client portal) are created with **`mfaEnabled: false`**
- Admin “Reset MFA” **disables** MFA (does not force re-enroll)

### Do not reintroduce

- Env gates like `APP_ENV === "staging"` for MFA-off (this product line will become its own production; staging-only conditions break)
- Forcing all customers through MFA setup when `mfaEnabled` is false

## Debug floating toolbar

Floating debug capture buttons (bottom-right / debug mode) are available when app env is **development or staging**.

- Admin: `apps/admin/lib/app-env.ts`, `use-is-debug-tools-app-env.ts`, `components/debug/DebugModeGate.tsx`
- API: `packages/api/src/lib/app-env.ts`, `assertDebugToolsEnvMiddleware` on `/api/admin/debug-capture-tickets`
- Database settings page remains **development-only** (`assertDevEnvMiddleware`)
- Set on Railway Admin: `ENV=staging`, `NEXT_PUBLIC_TBOS_ENV=staging`
- Set on Railway API: `ENV=staging`
- Debug portal URL: `NEXT_PUBLIC_DEBUG_PORTAL_URL` / `DEBUG_PORTAL_PUBLIC_URL` (staging example: `https://debug-web-staging.up.railway.app`)
- Debug portal theme: violet CSS tokens in `apps/debug-portal/app/globals.css` (fixed for this product; not env-switched)

## CRM / Sales UI (recent work)

Admin Sales family (Tibosx chrome / CRM v1):

| Area | Routes / notes |
|------|----------------|
| Home widgets | `/` home — header/sidebar/home matched to HTML refs |
| Sales dashboard | `/sales/dashboard` (pipeline screen) |
| Clients | `/clients/*` |
| Engagement / leads | `/leads` etc. — inbound engagement |
| Planning / opportunities | `/opportunities` — pipeline board |
| CRM settings | `/settings/crm/*` (tenants, pipelines, workspace, …) |
| API | `/api/admin/crm/*` (leads, pipelines, quotes, home-widgets, …) |

Opportunities UI was matched to PDF wireframes. Home/header/sidebar matched Claude HTML artifact references.

## Railway notes (staging)

Typical staging hosts:

- Admin: `https://staging.tibosx.ai.techbubble.net.au`
- API: `https://techbubbleapi-staging.up.railway.app`
- Debug web: staging debug portal URL via env

**Admin Panel must proxy to staging API:**

- `API_URL=https://techbubbleapi-staging.up.railway.app`
- `NEXT_PUBLIC_API_URL=https://techbubbleapi-staging.up.railway.app`

If Admin `API_URL` points at development, login/MFA will hit the **wrong database**.

**Moving staging to a new Railway project:** Railway cannot transfer a single environment. Recreate staging services in a new project; leave old project’s prod/dev untouched. Project-level transfer moves everything.

## Common commands

```bash
pnpm install
pnpm --filter @techbubble/api build          # must pass before API Docker deploy
pnpm --filter @techbubble/database exec prisma migrate deploy
pnpm --filter @techbubble/admin dev
pnpm --filter @techbubble/api dev
```

API Docker builds run `tsc`; a missing Prisma `select` field (e.g. `totpSecretEnc` on `/me`) fails the whole deploy.

## Coding conventions (short)

- Prefer existing patterns in `apps/admin` and `packages/api`.
- Admin API calls: `adminFetch` from `@/lib/admin-api`.
- Commits: only when the user asks; follow repo message style.
- Do not commit secrets (`.env`, credentials).
- Frontend design: follow established Tibosx / admin design system; don’t invent a new purple-on-white marketing look inside admin.
- For new designs needing APIs: check related APIs in this monorepo first; never edit `proprly-api`.

## Agent operating checklist

1. Confirm which **git remote** you should push to (`tibosx-crm` vs `origin`).
2. Confirm which **database** (`nozomi` / `junction` / `shortline`) before MFA or data scripts.
3. Confirm Admin **`API_URL`** matches the intended API environment.
4. After auth/MFA changes, run `pnpm --filter @techbubble/api` `tsc` / build locally.
5. After schema changes, add a Prisma migration under `packages/database/prisma/migrations/`.
6. Do not assume “staging” env-name checks for permanent product behaviour — this repo becomes its own production.

## Handoff context (Nov 2026)

Recent agent work on the staging line included:

- CRM Opportunities / Home / Sales submenu pages from wireframes & HTML
- MFA made optional via DB + login logic; all users MFA-cleared on staging (+ later development) DBs
- Debug portal violet theme
- Debug floating toolbar enabled for staging
- Fixed `/me` select to include `totpSecretEnc` (API build break)
- Seeded https://github.com/Techbubble-Australia/tibosx-crm.git with `master` + `staging` from this snapshot
