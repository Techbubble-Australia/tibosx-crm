# Default Railway image (root Dockerfile) = **client support portal** (Next.js).
# Ticketing API routes run on the main TBOS API service (packages/api), not a separate image.
# Canonical portal copy: Dockerfile.ticketing (railway.ticketing.toml)
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
