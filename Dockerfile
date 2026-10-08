# Default image when Railway builds from the repo root without a service-specific
# config file (typical for the client ticketing portal service).
#
# TBOS API / web / admin / ticketing-api: set Railway Config file to
# railway.api.toml, railway.web.toml, railway.admin.toml, or railway.ticketing-api.toml.
#
# Canonical copy: Dockerfile.ticketing (keep in sync when changing portal build).
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json ./packages/config/
COPY apps/ticketing/package.json ./apps/ticketing/

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @techbubble/ticketing build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/ticketing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/ticketing/.next/static ./apps/ticketing/.next/static

USER nextjs

ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "apps/ticketing/server.js"]
