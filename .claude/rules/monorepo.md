# Monorepo

## Root-Level Scripts Only
- All commands run from the project root. Never `cd` into services.
- Pattern: `pnpm dev`, `pnpm test:backend`, `pnpm db:migrate`.

## Shared Packages
- Reusable code lives in `packages/` (e.g., `packages/db/`).
- Services import from shared packages. No copy-paste between services.
- Constants, enums, and types defined once in the shared package.

## Package Management
- Python: `uv` (backend/worker).
- Add packages via Docker when services are containerized:
  `docker compose exec backend uv add <pkg>`

## Container Orchestration
- Docker Compose for local dev.
- Each service has its own Dockerfile.
- Shared packages are mounted/copied into service containers.
