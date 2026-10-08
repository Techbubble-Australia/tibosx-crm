# ---------------------------------------------------------------------------
# This file is not used for production deploys.
#
# The monorepo uses pnpm (pnpm-lock.yaml) and per-service Dockerfiles:
#   Dockerfile.api, Dockerfile.admin, Dockerfile.web,
#   Dockerfile.ticketing, Dockerfile.ticketing-api
#
# Railway: Service → Settings → Config file → railway.<service>.toml
#   ticketing portal  → railway.ticketing.toml
#   ticketing API     → railway.ticketing-api.toml
#
# Local: docker-compose.yml points at Dockerfile.api / .web / .admin
# ---------------------------------------------------------------------------
FROM node:20-alpine
RUN echo "Build aborted: set Railway 'Config file' to railway.ticketing.toml (or the matching railway.*.toml for this service). Root Dockerfile is intentionally disabled." >&2 \
  && exit 1
