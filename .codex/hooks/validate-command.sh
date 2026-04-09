#!/usr/bin/env bash
# PreToolUse hook for Codex — blocks destructive commands.
# Exit 0 = allow, Exit 2 = deny with JSON output.
#
# This mirrors .codex/rules/project.rules but at the tool-call level,
# catching commands that slip through Starlark pattern matching
# (e.g., complex shell scripts that aren't split into individual commands).

set -euo pipefail

# The command is passed as arguments
CMD="$*"

# Block patterns
case "$CMD" in
    *"rm -rf"*|*"rm -r -f"*)
        echo '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"Blocked: rm -rf is forbidden. Use targeted deletes."}}'
        exit 2
        ;;
    *"git push --force "*|*"git push -f "*)
        echo '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"Blocked: force push is forbidden. Use --force-with-lease."}}'
        exit 2
        ;;
    *"git reset --hard"*)
        echo '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"Blocked: git reset --hard is forbidden. Use git stash or git revert."}}'
        exit 2
        ;;
    *"git clean -f"*|*"git checkout ."*)
        echo '{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"Blocked: destructive git operation. Review changes manually first."}}'
        exit 2
        ;;
esac

# Allow everything else
exit 0
