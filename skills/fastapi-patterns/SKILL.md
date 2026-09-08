---
name: fastapi-patterns
description: FastAPI architecture, dependency injection, domain-error handling, SQLAlchemy data access, async safety, and Alembic conventions. Use when building or modifying FastAPI apps, in addition to python-patterns.
---
# FastAPI

## Architecture
- Preserve the project’s existing architecture; introduce layers only when shared business logic needs them.
- Use existing boundaries. Simple CRUD may call a store/ORM directly from a router; extract services for substantive shared business logic and repositories only when they add a useful boundary.

## Dependency Injection
- Prefer `Annotated` dependencies when supported by the project's FastAPI and Python targets; otherwise preserve the established supported form.
- Parse settings at a single boundary, using the project’s existing settings mechanism.

## Error Handling
- `HTTPException` is sufficient for route-local HTTP failures. When domain logic is shared outside HTTP, use domain errors and boundary exception handlers.

## Data
- Pydantic `BaseModel` for request/response schemas.
- When SQLAlchemy is in use, prefer its current query APIs where supported by the project's installed version. Do not run synchronous database I/O on the async event loop.
- Choose soft versus hard deletion from retention, uniqueness, and erasure requirements; do not add soft deletion by default.
- Use Alembic migrations for database schema changes.

## Background Work
- `BackgroundTasks` only for fire-and-forget under ~30s; anything requiring durable delivery or retries goes to the project’s queue.
- Test enqueue behavior separately from worker behavior. Use hermetic worker/integration tests when execution or delivery is the failing boundary.

## Pagination & Responses
- Cursor-based pagination for list endpoints; one shared response envelope schema across all endpoints.

## AuthN/Z
- Authentication belongs at the HTTP boundary (for example, a router dependency). Authorization is mandatory: enforce each decision at the project's existing reusable policy, dependency, or domain boundary. Put shared business authorization in services when services are that boundary; do not add a service layer solely for route-local checks.
- Tenancy scoping applied in the session/repository layer only — never per-query `WHERE` discipline.

## Shared Packages
- Share models where the repository already owns persistence; a standalone service need not introduce `packages/db/`.
- Share enums/constants in the existing owning module; import rather than duplicate.
