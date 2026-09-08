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
- Use union syntax supported by the project's Python target (`X | None` where available; otherwise `Optional[X]`). No untyped `**kwargs` in public APIs.
- Use stdlib dataclasses for internal records; use Pydantic at boundaries when its validation is needed and already available.
- `Protocol` for interfaces (duck typing).
- Use validation and configuration APIs consistently for the project's installed Pydantic version; do not migrate solely to copy newer syntax.
- Top-level imports only. No nested/inline imports inside functions or methods. The only exception is breaking a genuine circular import — and even then, fix the cycle instead.

## Side effects & boundaries
- Inject HTTP clients, DB sessions, time, randomness, env vars as parameters or attributes. Never reach for them inside business logic.
- Context managers for resources. Generators for lazy evaluation.
- `logging` for application diagnostics; `print()` is appropriate for a CLI’s intentional user output.
- Centralize config at the boundary. Use existing settings tooling; stdlib environment parsing is sufficient for small scripts, and `pydantic-settings` is appropriate when structured validation warrants it. Never hardcode secrets.

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
- Use asyncio for I/O-bound work and thread pools to isolate synchronous libraries when needed. GIL-bound Python code does not gain CPU parallelism from threads; consider processes or native code that releases the GIL. On a free-threaded runtime, verify dependency support and measure thread scaling.

## Tooling
- Use the existing formatter, lint/type checks, and security checks. Do not add tooling just to satisfy a preference.
- For new packaged projects, `uv` is a useful default; preserve existing package managers/build backends unless migration is requested.
- Use the established layout; a small script need not become a package.
- Centralize settings parsing and inject the result; avoid scattered environment reads in business logic.
- Use the established test runner; add plugins only when required. Unit tests isolate external services and time. Hermetic integration tests may use local processes, sockets, temporary files, and disposable databases; real-boundary regressions require evidence at the failing surface. Use the established runner and fixtures.
