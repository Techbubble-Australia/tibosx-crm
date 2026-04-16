# Multi-stage Docker build for TechBubble monorepo
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY packages/api/package.json ./packages/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/

RUN npm ci

# Generate Prisma Client
FROM deps AS prisma
COPY packages/database/prisma ./packages/database/prisma/
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Build the application
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Build packages
RUN npm run build --workspace=@techbubble/config || true
RUN npm run build --workspace=@techbubble/ui
RUN npm run build --workspace=@techbubble/database

# Build API
RUN npm run build --workspace=@techbubble/api

# Build Next.js apps
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@techbubble/web
RUN npm run build --workspace=@techbubble/admin

# Production image, copy all the files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./apps/admin/
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000 3001 3002

# Start all services using a simple node script
CMD ["node", "packages/api/dist/index.js"]
