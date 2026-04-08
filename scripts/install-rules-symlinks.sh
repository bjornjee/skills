#!/usr/bin/env bash
# install-rules-symlinks.sh
#
# Symlinks the 6 rule files from this plugin repo into ~/.claude/rules/
# so that Claude Code actually loads them at user scope.
#
# Why: Claude Code's plugin manifest schema has no `rules` field, so any
# .claude/rules/*.md files inside a plugin repo are orphaned. The supported
# locations are <project>/.claude/rules/ and ~/.claude/rules/. This script
# wires the plugin repo as the source of truth via symlinks.
#
# Idempotent. Safe to re-run after editing rule files.

set -euo pipefail

REPO_RULES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.claude/rules"
USER_RULES_DIR="$HOME/.claude/rules"

if [[ ! -d "$REPO_RULES_DIR" ]]; then
  echo "ERROR: source rules directory not found: $REPO_RULES_DIR" >&2
  exit 1
fi

mkdir -p "$USER_RULES_DIR"

RULE_FILES=(
  core.md
  python.md
  golang.md
  fastapi.md
  react-native.md
  ai-ml.md
)

for f in "${RULE_FILES[@]}"; do
  src="$REPO_RULES_DIR/$f"
  dst="$USER_RULES_DIR/$f"

  if [[ ! -f "$src" ]]; then
    echo "skip: $f (not in repo)"
    continue
  fi

  if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
    echo "ok:   $f (already symlinked)"
    continue
  fi

  if [[ -e "$dst" || -L "$dst" ]]; then
    echo "warn: $dst already exists; backing up to $dst.bak" >&2
    mv "$dst" "$dst.bak"
  fi

  ln -s "$src" "$dst"
  echo "link: $f -> $src"
done

echo
echo "Done. ~/.claude/rules/ now contains:"
ls -la "$USER_RULES_DIR"
