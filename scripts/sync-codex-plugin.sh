#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/skills"
DST_DIR="$REPO_ROOT/plugins/skills/skills"

usage() {
  echo "Usage: $0 [--check]"
}

case "${1:-}" in
  "")
    mkdir -p "$DST_DIR"
    rsync -a --delete "$SRC_DIR/" "$DST_DIR/"
    echo "Synced $SRC_DIR to $DST_DIR"
    ;;
  "--check")
    diff -qr "$SRC_DIR" "$DST_DIR"
    ;;
  "-h"|"--help")
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
