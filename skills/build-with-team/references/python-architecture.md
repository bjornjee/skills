# Python architecture

Choose boundaries around capabilities and side effects. An HTTP API, CLI, or worker
can call the same application behavior without each owning a copy of its rules.
A small script or direct route-to-store flow need not gain extra layers.

## Illustrative organization

```text
pyproject.toml
src/<package>/
  app.py                 Entrypoint and dependency composition
  <capability>/          Behavior, owned types, and adapters as needed
  settings.py            Configuration parsing
tests/                   Tests for the application's contracts
```

This is an option for a packaged application, not a migration requirement.
Keep a coherent flat layout where appropriate. A `src` layout requires package
installation and helps expose accidental imports from the repository root.
[Python packaging guidance](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/).

## Decisions that affect reuse

- Keep domain rules independent of HTTP request objects, CLI parsing, and deployment
  configuration. Entrypoints translate input and compose required dependencies.
- Pass clients and configuration into behavior instead of creating hidden network
  connections or reading environment variables during module import.
- Let each capability own its types. Share a contract when callers need the same
  meaning; do not create a global models package merely because types look similar.
- Introduce a protocol or adapter for a real substitution or boundary. A concrete
  dependency is sufficient when it already expresses the required contract.

## Example and evidence

KPJ's [composition module](https://github.com/deploy-co/sales-kpj-privacy/blob/1403d1cf01f395adb2cf205b9962d5d6750aa0b5/src/kpj_privacy/backend/composition.py)
constructs redaction dependencies and supplies them to its
[workflow](https://github.com/deploy-co/sales-kpj-privacy/blob/1403d1cf01f395adb2cf205b9962d5d6750aa0b5/src/kpj_privacy/privacy_pipeline/workflow.py).
This illustrates dependency ownership, not a required pipeline abstraction.

Where multiple entrypoints share behavior, trace them to the same implementation
and exercise their boundary translations. For packaged delivery, verify imports
from the installed artifact rather than relying solely on repository-local tests.
