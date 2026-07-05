---
paths:
  - "**/*.sh"
---
# Shell

- `set -euo pipefail` is the first non-comment line of every script. `set -x` behind a `DEBUG` env check, not commented out.
- Quote every expansion: `"$var"`, `"$(cmd)"`, `"$@"`. Unquoted expansion is the top shell bug class.
- `shellcheck` clean before commit; suppressions need a `# shellcheck disable=SCXXXX` with a reason on the same line.
- Temp resources get `trap 'rm -rf "$TMPDIR_LOCAL"' EXIT` at creation, not cleanup calls at every exit path.
- Never parse `ls`; use globs (guard empty globs — no `nullglob` under `set -u` means test `[[ -e $f ]]`) or `find -print0 | while IFS= read -r -d ''`.
- `$(...)` not backticks; `[[ ]]` not `[ ]`; `local` for every function variable.
- Heredoc delimiters quoted (`<<'EOF'`) unless expansion is intended — unquoted heredocs interpolate secrets into logs.
- Scripts that take paths handle spaces in them; test with one.
- Prefer `#!/usr/bin/env bash` and target bash ≥4 explicitly, or write strict POSIX `sh` — not an untested blend.
