# Shell

Choose Bash or POSIX `sh` deliberately, and validate required syntax and options on the actual target shell. Do not write an untested blend.

## Bash

- Use `#!/usr/bin/env bash` when the project targets Bash. Put `set -euo pipefail` at the first executable line. Enable `set -x` only behind a safe `DEBUG` check; never add environment dumps or tracing that can expose secrets.
- Use `$(...)`, `[[ ]]`, and `local` for function variables. Never parse `ls`; guard unmatched globs (for example, `[[ -e $f ]]`) or use `find -print0 | while IFS= read -r -d ''`.

## POSIX `sh`

- Use `#!/bin/sh` when the project targets POSIX `sh`. Put `set -eu` at the first executable line. Enable `pipefail` only after confirming the target shell supports it; recent POSIX shells may, while older deployed shells may not.
- Use `$(...)`, `[ ]`, and function variables without `local`. Never parse `ls`; use POSIX-safe glob handling or `find ... -exec`.

## All shells

- Quote every expansion: `"$var"`, `"$(cmd)"`, `"$@"`. Unquoted expansion is the top shell bug class.
- `shellcheck` clean before commit; suppressions need a `# shellcheck disable=SCXXXX` with a reason on the same line.
- Temp resources get `trap 'rm -rf "$TMPDIR_LOCAL"' EXIT` at creation, not cleanup calls at every exit path.
- Heredoc delimiters quoted (`<<'EOF'`) unless expansion is intended — unquoted heredocs interpolate secrets into logs.
- Scripts that take paths handle spaces in them; test with one.
