---
description: "Use when working in the TechBubble monorepo, especially for web/admin/api/database changes. Covers package names, workspace paths, build/dev commands, aliases, shared utility classes, and environment variable conventions. Trigger on: techbubble, monorepo, @techbubble/web, @techbubble/api, build fails, env setup."
---

# TechBubble Stack Conventions

## Workspace Structure

- Monorepo root package: `techbubble-monorepo`
- App packages:
  - `@techbubble/web` at `apps/web`
  - `@techbubble/admin` at `apps/admin`
- Shared/backend packages:
  - `@techbubble/api` at `packages/api`
  - `@techbubble/database` at `packages/database`
  - `@techbubble/ui` at `packages/ui`
  - `@techbubble/config` at `packages/config`

## Commands

- Web dev: run `pnpm dev` inside `apps/web` or `pnpm --filter @techbubble/web dev` from repo root.
- Web build: `pnpm --filter @techbubble/web build`.
- If Next.js build artifacts are stale, clean first: `cd apps/web && rm -rf .next` then rebuild.

## Path Aliases and Assets

- In web app TS config, `@image/*` maps to `apps/web/src/image/*`.
- For homepage/marketing sections, prefer importing concrete assets from `@image/`.
- Do not replace known image assets with placeholders unless explicitly requested.

## UI Baseline Utilities

- Global utility classes (defined in `apps/web/app/globals.css`):
  - `tb-container`
  - `tb-btn-primary`
  - `tb-btn-ghost`
- Prefer these before introducing new layout/button primitives.

## Typography and Tailwind Baseline

- Web app uses Inter via `next/font/google` in `apps/web/app/layout.tsx`.
- Tailwind config lives at `apps/web/tailwind.config.ts`.
- If animation utilities are needed, add them under `theme.extend.keyframes` and `theme.extend.animation`.

## Environment Variables

- Core variables used in the repo:
  - `DATABASE_URL`
  - `API_URL`
  - `PORT`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `JWT_SECRET`
  - `UPLOAD_DIR` (local uploads when `OBJECT_STORAGE_*` is unset)
  - `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY` (optional; S3-compatible bucket on API)
  - `OBJECT_STORAGE_FORCE_PATH_STYLE` (optional, default true)
  - `ALLOWED_ORIGINS`
  - `NODE_ENV`
- Prefer updating `.env.example` whenever introducing new required env vars.

## Backend Facts

- Database package: `@techbubble/database`.
- Prisma schema: `packages/database/prisma/schema.prisma`.
- API entry point: `packages/api/src/index.ts`.

## Guardrails

- Keep edits scoped to the relevant package.
- Avoid cross-package refactors unless requested.
- Validate web changes with `pnpm --filter @techbubble/web build` before completion.