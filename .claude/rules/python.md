---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python

- PEP 8. Type annotations on all function signatures.
- Pydantic `BaseModel` over `@dataclass` for data classes.
- Immutability: `frozen=True` dataclasses or NamedTuple where Pydantic isn't needed.
- Protocol for interfaces (duck typing).
- Context managers for resources. Generators for lazy evaluation.
- `logging` module, never `print()`.
- Secrets via `dotenv` + `os.environ`, never hardcoded.
- Tooling: black, isort, ruff, mypy/pyright, bandit.
- Testing: pytest, `--cov` with term-missing, `pytest.mark` for unit/integration.
