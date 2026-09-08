#!/usr/bin/env bash
set -euo pipefail

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' '[StrategicCompact] Reminder skipped: python3 is required.' >&2
  exit 0
fi

exec python3 "$(dirname -- "${BASH_SOURCE[0]}")/scripts/suggest_compact.py"
