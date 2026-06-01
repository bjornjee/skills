#!/usr/bin/env bash
# sync-codex-plugin.sh
#
# The Codex plugin's skills directory is a symlink to the canonical top-level
# skills/ tree. This script verifies (and, with no args, repairs) that symlink.
# There is no longer a copied mirror to keep in sync.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LINK_PATH="$REPO_ROOT/plugins/skills/skills"
EXPECTED_TARGET="../../skills"

usage() {
  echo "Usage: $0 [--check]"
}

is_correct_symlink() {
  [[ -L "$LINK_PATH" && "$(readlink "$LINK_PATH")" == "$EXPECTED_TARGET" ]]
}

case "${1:-}" in
  "")
    if is_correct_symlink; then
      echo "ok: plugins/skills/skills -> $EXPECTED_TARGET"
      exit 0
    fi
    if [[ -e "$LINK_PATH" || -L "$LINK_PATH" ]]; then
      rm -rf "$LINK_PATH"
    fi
    ln -s "$EXPECTED_TARGET" "$LINK_PATH"
    echo "linked: plugins/skills/skills -> $EXPECTED_TARGET"
    ;;
  "--check")
    if is_correct_symlink; then
      exit 0
    fi
    echo "drift: plugins/skills/skills is not a symlink to $EXPECTED_TARGET" >&2
    exit 1
    ;;
  "-h"|"--help")
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
