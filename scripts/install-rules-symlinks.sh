#!/usr/bin/env bash
# Explicit user-scope install; --check never creates or changes destinations.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_RULES_DIR="$REPO_ROOT/.claude/rules"
USER_RULES_DIR="$HOME/.claude/rules"
CHECK=false
case "${1:-}" in
  '') [[ $# -eq 0 ]] || exit 2 ;;
  --check) [[ $# -eq 1 ]] || exit 2; CHECK=true ;;
  *) echo 'usage: install-rules-symlinks.sh [--check]' >&2; exit 2 ;;
esac

if [[ ! -d "$REPO_RULES_DIR" ]]; then
  echo "ERROR: source rules directory not found: $REPO_RULES_DIR" >&2
  exit 1
fi
if ! "$CHECK"; then
  git_dir="$(git -C "$REPO_ROOT" rev-parse --absolute-git-dir)"
  common_dir="$(git -C "$REPO_ROOT" rev-parse --path-format=absolute --git-common-dir)"
  if [[ "$git_dir" != "$common_dir" ]]; then
    echo 'Refusing permanent rule links into a linked worktree; install from the chosen permanent checkout after merge.' >&2
    exit 1
  fi
  if [[ -L "$HOME/.claude" || -L "$USER_RULES_DIR" ]]; then
    echo 'Refusing symlinked rule destination directories.' >&2
    exit 1
  fi
  mkdir -p "$USER_RULES_DIR"
fi

status=0
for src in "$REPO_RULES_DIR"/*.md; do
  [[ -f "$src" ]] || continue
  f="$(basename "$src")"
  dst="$USER_RULES_DIR/$f"
  if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
    echo "ok: $f"
    continue
  fi
  if "$CHECK"; then
    echo "drift: $dst" >&2
    status=1
    continue
  fi
  if [[ -e "$dst" || -L "$dst" ]]; then
    if [[ -d "$dst" && ! -L "$dst" ]]; then
      echo "Refusing directory collision: $dst" >&2
      exit 1
    fi
    bak="$(mktemp "$dst.backup.XXXXXX")"
    mv "$dst" "$bak"
    echo "backup: $bak"
  fi
  ln -s "$src" "$dst"
  echo "link: $f -> $src"
done
exit "$status"
