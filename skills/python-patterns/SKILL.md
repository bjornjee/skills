---
name: python-patterns
description: Python style, typing, side-effect, error-handling, async, and tooling conventions (ruff, uv, pytest, pydantic-settings). Use when writing or reviewing Python code.
---
# Python

Loads when editing Python. Generic + my preferences flattened. Project-specific
rules belong in each project's CLAUDE.md. Strict review enforcement lives in
the `python-reviewer-strict` agent.

## Style & types
- PEP 8. Type annotations on every public function signature.
- PEP 604 union syntax (`X | None`), not `Optional[X]`. No untyped `**kwargs` in public APIs.
- Pydantic `BaseModel` over `@dataclass` for data classes. `frozen=True` or `NamedTuple` when Pydantic isn't needed.
- `Protocol` for interfaces (duck typing).
- Pydantic v2 idioms: `@field_validator` / `@model_validator`, discriminated unions via `Field(discriminator=...)`, `model_config` — not the v1 class `Config`.
- Top-level imports only. No nested/inline imports inside functions or methods. The only exception is breaking a genuine circular import — and even then, fix the cycle instead.

## Side effects & boundaries
- Inject HTTP clients, DB sessions, time, randomness, env vars as parameters or attributes. Never reach for them inside business logic.
- Context managers for resources. Generators for lazy evaluation.
- `logging` module, never `print()`.
- Secrets and config via `pydantic-settings` (`BaseSettings`). Never hardcoded, never `os.getenv()` scattered through the codebase.

## Errors
- No silent exceptions. No `except:`, no `except Exception: pass`, no `except Exception: return None`.
- Re-raise with context: `raise X from err`. Or narrow the exception type. Or comment why swallowing is correct.

## No fallbacks
- One implementation per feature. `try: import X; except ImportError: from .fallback import X` only at a documented optional-dependency boundary.
- No mutable default arguments. `def f(x=[])` and `def f(x={})` are bugs.

## Async
- No blocking calls inside `async def` (`time.sleep`, `requests.get`, sync DB drivers, sync file I/O).
- Store references to `asyncio.create_task(...)` — bare task spawns can be GC'd mid-flight.

## Concurrency model
- asyncio for I/O-bound; `ProcessPoolExecutor` for CPU-bound (the GIL makes threads useless there); thread pools only to wrap sync libraries that can't be made async.

## Tooling
- Format + lint: `ruff` (with `ruff format`). Types: `mypy`. Security: `bandit`.
- Package management: `uv`. Build backend: `hatchling`. Dev/test extras via uv dependency-groups — no `requirements-dev.txt`.
- Layout: `src/` package, `tests/` at repo root.
- Settings: a single `Settings(BaseSettings)` class in `src/settings.py` exposed via an `@lru_cache(maxsize=1) get_settings()` function. No scattered `os.getenv` calls.
- Tests: `pytest`, `pytest-cov`, `pytest-asyncio`, `pytest-mock`. Tests never touch the real network, real DB, real wall clock — use `tmp_path`, `monkeypatch`, `responses`/`httpx.MockTransport`, `freezegun`.
