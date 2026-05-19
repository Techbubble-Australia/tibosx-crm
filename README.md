# TechBubble Monorepo

A full-stack monorepo for TechBubble - AI-driven digital transformation company.

## Structure

```
techbubble-monorepo/
├── apps/
│   ├── web/              # Next.js website (Port 3000)
│   └── admin/            # Next.js admin panel (Port 3002)
├── packages/
│   ├── api/              # Express.js backend API (Port 3001)
│   ├── database/         # Prisma ORM & database schema
│   ├── ui/               # Shared UI components
│   └── config/           # Shared configuration (TS, Tailwind)
├── docker-compose.yml    # Local development setup
├── Dockerfile.*          # Production Dockerfiles
└── railway.json          # Railway deployment config
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start all services:**
   ```bash
   npm run dev
   ```

   This will start:
   - Website: http://localhost:3000
   - API: http://localhost:3001
   - Admin Panel: http://localhost:3002

### Docker Development

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Deployment to Railway

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### 2. Add Services

Create the following services in Railway:

1. **PostgreSQL** - Railway provides this as a plugin
2. **API** - Deploy from `Dockerfile.api`
3. **Web** - Deploy from `Dockerfile.web`
4. **Admin** - Deploy from `Dockerfile.admin`

Enable monorepo auto-deploy by setting each service to use the matching config file:

- API service config: `railway.api.toml`
- Web service config: `railway.web.toml`
- Admin service config: `railway.admin.toml`

Important for monorepo workspaces: each Railway service must use the repository root as the service Root Directory (not `apps/web`, `apps/admin`, or `packages/api`).
If the Root Directory points to a subfolder, Railway will not have workspace package context and deploys fail with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`.

These configs include `watchPatterns` so each service deploys only when relevant files change.

### 3. Environment Variables

Set the following environment variables for each service:

**API Service:**
- `DATABASE_URL` - Connection string from Railway PostgreSQL
- `JWT_SECRET` - Random secret for JWT
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
- **File storage (pick one):**
  - **Railway Bucket / S3-compatible (production):** set `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_REGION` (e.g. `auto`), `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ACCESS_KEY_ID`, and `OBJECT_STORAGE_SECRET_ACCESS_KEY`. Optional: `OBJECT_STORAGE_FORCE_PATH_STYLE` (`true` by default). Uploads are stored in the bucket; the API still serves them at `GET /uploads/...` for the web and admin proxies.
  - **Local disk (default / local dev):** set `UPLOAD_DIR` (e.g. `/app/uploads` in Docker). Omit all `OBJECT_STORAGE_*` variables.

**Web & Admin Services:**
- `API_URL` - URL of your deployed API service (server-side proxy to `/uploads` and `/api`)
- **`NEXT_PUBLIC_API_URL`** (recommended for production Docker/Railway) - the **public https** API base, identical to what you would open in a browser. Next.js inlines this at **`next build`**, so the browser can load `GET /uploads/...` images directly from the API (avoids broken same-origin proxying and matches object-storage URLs). Set it as a **Docker build argument** (see `Dockerfile.admin` / `Dockerfile.web`: `ARG NEXT_PUBLIC_API_URL`) or ensure the variable is present when the image is built. If unset, uploads fall back to same-origin `/uploads/...` (Next route → `API_URL`).

### 4. Deploy

```bash
# Deploy all services (API, Web, Admin) from the repo root
npm run deploy:railway

# Optional: deploy a single service
npm run deploy:railway:api
npm run deploy:railway:web
npm run deploy:railway:admin
```

Or deploy automatically via GitHub integration.

## Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

## Admin Panel

Default login credentials:
- **Email:** admin@techbubble.com
- **Password:** admin123

Change these in production via environment variables.

## Features

### Website
- Home page with company overview
- Case Studies listing with dynamic data
- Individual Case Study pages
- About, Services, Pricing, Careers, Contact pages
- Responsive design matching TechBubble brand

### Admin Panel
- Secure authentication
- Case Study CRUD operations
- Image upload support
- Rich content editing

### API
- RESTful endpoints for case studies
- JWT-based authentication
- File upload handling
- Contact form submissions
- Career application submissions

## Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL, Prisma ORM
- **Monorepo:** Turborepo
- **Deployment:** Railway, Docker

## License

Private - All rights reserved.
# tech-bubble-mono
