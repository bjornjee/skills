---
name: fastapi-patterns
description: FastAPI service-layer architecture, dependency injection, domain-error handling, SQLAlchemy 2.0 async, and Alembic conventions. Use when building or modifying FastAPI apps, in addition to python-patterns.
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
- Soft delete by default (`is_deleted` flag). Hard delete only with explicit justification (e.g. GDPR erasure), documented in the migration.
- Alembic for migrations. Never modify the database outside migrations.

## Background Work
- `BackgroundTasks` only for fire-and-forget under ~30s; anything heavier or retryable goes to a real queue (ARQ).
- Test background work by asserting the enqueue happened — never by running the task inline in the test.

## Pagination & Responses
- Cursor-based pagination for list endpoints; one shared response envelope schema across all endpoints.

## AuthN/Z
- Authentication as a router dependency (`Depends(get_current_user)`); RBAC decisions live in the service layer.
- Tenancy scoping applied in the session/repository layer only — never per-query `WHERE` discipline.

## Shared Packages
- Centralized models in `packages/db/`.
- Enums and constants in `packages/db/constants.py` — import, don't duplicate.
