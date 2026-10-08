# Default Railway image when no service-specific config is set (root Dockerfile).
# This builds the **ticketing API** so a service named "backend" deploys correctly.
#
# **Portal** service: set RAILWAY_DOCKERFILE_PATH=Dockerfile.ticketing
#   (or Config file railway.ticketing.toml). Start: node apps/ticketing/server.js
#
# TBOS api/web/admin: railway.api.toml / railway.web.toml / railway.admin.toml
#
# Canonical copy: Dockerfile.ticketing-api (keep in sync).
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ticketing-database/package.json ./packages/ticketing-database/
COPY packages/ticketing-api/package.json ./packages/ticketing-api/
COPY packages/config/package.json ./packages/config/

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter @techbubble/ticketing-database exec prisma generate
RUN pnpm --filter @techbubble/ticketing-database build
RUN pnpm --filter @techbubble/ticketing-api build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-api/dist ./packages/ticketing-api/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-api/package.json ./packages/ticketing-api/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-database/package.json ./packages/ticketing-database/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-database/dist ./packages/ticketing-database/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-database/prisma ./packages/ticketing-database/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-database/generated ./packages/ticketing-database/generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-api/node_modules ./packages/ticketing-api/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-database/node_modules ./packages/ticketing-database/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/ticketing-api/scripts/start-production.sh ./packages/ticketing-api/scripts/start-production.sh

USER nextjs

EXPOSE 3003

CMD ["sh", "packages/ticketing-api/scripts/start-production.sh"]
