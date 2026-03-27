---
paths:
  - "**/*.py"
  - "**/routers/**"
  - "**/services/**"
  - "**/models/**"
---
# FastAPI

## Architecture
- **Service layer pattern**: business logic in `services/`, thin routers.
- Routers call services. Services call repositories/ORM. Never skip layers.

## Dependency Injection
- `Annotated[Type, Depends()]` for all injected dependencies.
- Settings via `get_settings()` class, never `os.getenv()` directly.

## Error Handling
- Domain exceptions: `NotFoundError`, `ValidationError`, `ConflictError`.
- Exception handlers auto-route domain errors to HTTP status codes.
- No try/except in routers — let the exception handlers do their job.

## Data
- Pydantic `BaseModel` for request/response schemas.
- SQLAlchemy 2.0 async: `select()` not `query()`. Async sessions everywhere.
- Soft delete only (`is_deleted` flag). Never hard delete.
- Alembic for migrations. Never modify the database outside migrations.

## Shared Packages
- Centralized models in `packages/db/`.
- Enums and constants in `packages/db/constants.py` — import, don't duplicate.
