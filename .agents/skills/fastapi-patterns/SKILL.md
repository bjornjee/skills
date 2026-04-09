---
name: fastapi-patterns
description: REQUIRED when writing FastAPI routers, services, models, or schemas. Enforces service-layer architecture, dependency injection with Annotated, domain exceptions, async SQLAlchemy 2.0, and soft delete. Do NOT write FastAPI code without this skill active.
---

# FastAPI Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed in FastAPI services.

## When to Activate

- Any task involving FastAPI routers, services, models, or schemas
- Files in `routers/`, `services/`, `models/`, `schemas/`, or `main.py`
- This skill activates implicitly for all FastAPI work

## Architecture

- **Service layer pattern**: business logic in `services/`, thin routers.
- Routers call services. Services call repositories/ORM. Never skip layers.

```python
# Good: Thin router, logic in service
@router.post("/users", status_code=201)
async def create_user(
    body: CreateUserRequest,
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserResponse:
    user = await service.create(body)
    return UserResponse.model_validate(user)

# Bad: Business logic in router
@router.post("/users", status_code=201)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    user = User(**body.model_dump())
    db.add(user)
    await db.commit()  # ORM calls don't belong in routers
```

## Dependency Injection

- `Annotated[Type, Depends()]` for all injected dependencies.
- Settings via `get_settings()` class, never `os.getenv()` directly.

```python
# Good
async def create_user(
    service: Annotated[UserService, Depends(get_user_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserResponse: ...

# Bad
async def create_user(service=Depends(get_user_service)): ...  # Missing Annotated
```

## Error Handling

- Domain exceptions: `NotFoundError`, `ValidationError`, `ConflictError`.
- Exception handlers auto-route domain errors to HTTP status codes.
- No try/except in routers — let the exception handlers do their job.

```python
# Domain exceptions (defined once, used everywhere)
class NotFoundError(Exception):
    def __init__(self, resource: str, id: str):
        self.resource = resource
        self.id = id

class ConflictError(Exception):
    def __init__(self, message: str):
        self.message = message

# Exception handler (registered once in app setup)
@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": f"{exc.resource} {exc.id} not found"})
```

## Data

- Pydantic `BaseModel` for request/response schemas.
- SQLAlchemy 2.0 async: `select()` not `query()`. Async sessions everywhere.
- Soft delete only (`is_deleted` flag). Never hard delete.
- Alembic for migrations. Never modify the database outside migrations.

```python
# Good: SQLAlchemy 2.0 style
stmt = select(User).where(User.id == user_id, User.is_deleted == False)
result = await session.execute(stmt)
user = result.scalar_one_or_none()

# Bad: Legacy style
user = session.query(User).filter_by(id=user_id).first()  # Not async, old API
```

## Shared Packages

- Centralized models in `packages/db/`.
- Enums and constants in `packages/db/constants.py` — import, don't duplicate.
