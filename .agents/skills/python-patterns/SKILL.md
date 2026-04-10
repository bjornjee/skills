---
name: python-patterns
description: REQUIRED when writing, editing, or reviewing any Python (.py, .pyi) file. Enforces PEP 8, type annotations, Pydantic models, dependency injection, async safety, and test isolation. Do NOT write Python code without this skill active.
---

# Python Conventions — Mandatory

These are not suggestions. Every rule below MUST be followed when writing Python code. Violations are bugs.

## When to Activate

- Any task involving `.py` or `.pyi` files
- This skill activates implicitly for all Python work

## Style & Types

- PEP 8. Type annotations on every public function signature.
- PEP 604 union syntax (`X | None`), not `Optional[X]`. No untyped `**kwargs` in public APIs.
- Pydantic `BaseModel` over `@dataclass` for data classes. `frozen=True` or `NamedTuple` when Pydantic isn't needed.
- `Protocol` for interfaces (duck typing).
- Top-level imports only. No nested/inline imports inside functions or methods. The only exception is breaking a genuine circular import — and even then, fix the cycle instead.

```python
# Good
from typing import Protocol

class UserStore(Protocol):
    def get(self, id: str) -> User | None: ...
    def save(self, user: User) -> None: ...

# Bad
from typing import Optional
def get_user(id: str) -> Optional[User]:  # Use X | None
    from .db import session  # No nested imports
```

## Side Effects & Boundaries

- Inject HTTP clients, DB sessions, time, randomness, env vars as parameters or attributes. Never reach for them inside business logic.
- Context managers for resources. Generators for lazy evaluation.
- `logging` module, never `print()`.
- Secrets and config via `pydantic-settings` (`BaseSettings`). Never hardcoded, never `os.getenv()` scattered through the codebase.

```python
# Good: Dependency injection
class UserService:
    def __init__(self, store: UserStore, clock: Callable[[], datetime] = datetime.now):
        self._store = store
        self._clock = clock

# Bad: Reaching for globals
class UserService:
    def create(self, name: str) -> User:
        user = User(name=name, created_at=datetime.now())  # Untestable
        db.session.add(user)  # Global state
```

## Errors

- No silent exceptions. No `except:`, no `except Exception: pass`, no `except Exception: return None`.
- Re-raise with context: `raise X from err`. Or narrow the exception type. Or comment why swallowing is correct.
- No mutable default arguments. `def f(x=[])` and `def f(x={})` are bugs.

```python
# Good
try:
    result = parse(data)
except ValueError as err:
    raise ConfigError(f"invalid config section {name}") from err

# Bad
try:
    result = parse(data)
except Exception:
    pass  # Silent swallow
```

## Async

- No blocking calls inside `async def` (`time.sleep`, `requests.get`, sync DB drivers, sync file I/O).
- Store references to `asyncio.create_task(...)` — bare task spawns can be GC'd mid-flight.

```python
# Bad
async def fetch_user(id: str) -> User:
    response = requests.get(f"/users/{id}")  # Blocks the event loop

# Good
async def fetch_user(id: str, client: httpx.AsyncClient) -> User:
    response = await client.get(f"/users/{id}")
```

## Tooling

- Format + lint: `ruff` (with `ruff format`). Types: `mypy`. Security: `bandit`.
- Package management: `uv`. Build backend: `hatchling`.
- Layout: `src/` package, `tests/` at repo root.
- Settings: a single `Settings(BaseSettings)` class in `src/settings.py` exposed via an `@lru_cache(maxsize=1) get_settings()` function. No scattered `os.getenv` calls.

## Tests

- `pytest`, `pytest-cov`, `pytest-asyncio`, `pytest-mock`.
- Tests never touch the real network, real DB, real wall clock — use `tmp_path`, `monkeypatch`, `responses`/`httpx.MockTransport`, `freezegun`.
- TDD: write the test first, see it fail, then implement.

```python
# Good: Isolated test with injected dependencies
def test_user_service_creates_user(tmp_path):
    store = InMemoryUserStore()
    clock = lambda: datetime(2024, 1, 1)
    service = UserService(store=store, clock=clock)

    user = service.create("Alice")

    assert user.name == "Alice"
    assert user.created_at == datetime(2024, 1, 1)
    assert store.get(user.id) == user
```

## Quick Reference

| Rule | Enforcement |
|------|-------------|
| Type annotations on public functions | `mypy --strict` |
| PEP 604 unions | `ruff` rule UP007 |
| No mutable defaults | `ruff` rule B006 |
| No bare except | `ruff` rule E722 |
| No print() | `ruff` rule T201 |
| Import sorting | `ruff` rule I |
