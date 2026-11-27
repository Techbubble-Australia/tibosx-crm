# Root Dockerfile — same as Dockerfile.api (main TBOS API).
# The standalone support portal app was removed; client/customer support use TBOS /workspace.
# Prefer explicit paths in Railway: Dockerfile.api, Dockerfile.admin, Dockerfile.web.

FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/

# Corepack on current Node images will not download the packageManager version.
RUN npm install -g pnpm@9.15.9
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter @techbubble/database exec prisma generate
RUN pnpm --filter @techbubble/database build
RUN pnpm --filter @techbubble/api build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/scripts/start-production.sh ./packages/api/scripts/start-production.sh
RUN chmod +x /app/packages/api/scripts/start-production.sh
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

RUN mkdir -p /app/uploads/tickets && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3001

CMD ["/app/packages/api/scripts/start-production.sh"]
