---
name: terminal-ops
description: Evidence-first repo execution workflow. Use when the user wants a command run, a repo checked, a CI failure debugged, or a narrow fix pushed with exact proof of what was executed and verified.
---

# Terminal Ops

Use this when the user wants real repo execution: run commands, inspect git state, debug CI or builds, make a narrow fix, and report exactly what changed and what was verified.

This skill is intentionally narrower than general coding guidance. It is an operator workflow for evidence-first terminal execution.

## Skill Stack

Pull these skills and agents into the workflow when relevant:

- the project's test suite for exact proving steps after changes
- the `tdd-guide` agent when the right fix needs regression coverage
- `/security-review` when secrets, auth, or external inputs are involved
- `github-ops` when the task depends on CI runs, PR state, or release status
- LEARNINGS.md / project memory when the verified outcome needs to be captured into durable project context

## When to Use

- user says "fix", "debug", "run this", "check the repo", or "push it"
- the task depends on command output, git state, test results, or a verified local fix
- the answer must distinguish changed locally, verified locally, committed, and pushed

## Guardrails

- inspect before editing
- stay read-only if the user asked for audit/review only
- prefer repo-local scripts and helpers over improvised ad hoc wrappers
- do not claim fixed until the proving command was rerun
- do not claim pushed unless the branch actually moved upstream

### Destructive-command guardrails

Pause and confirm intent (or take the safer alternative) before any of:

- `rm -rf` on `/`, `~`, or a project root; `sudo rm`
- `git push --force` (use `--force-with-lease`), `git reset --hard`, `git checkout .` (discards all changes)
- `DROP TABLE` / `DROP DATABASE`; destructive `kubectl delete`; `docker system prune`
- `chmod 777`; accidental `npm publish`; anything with `--no-verify`

State what the command will destroy and the recovery path (or "none") before running it. Default-on for autonomous sessions (`codex -a never`). The agent-dashboard plugin's `warn-destructive` / `block-main-commit` hooks enforce a subset mechanically; this checklist covers the rest.

## Workflow

### 1. Resolve the working surface

Settle:

- exact repo path
- branch
- local diff state
- requested mode:
  - inspect
  - fix
  - verify
  - push

### 2. Read the failing surface first

Before changing anything:

- inspect the error
- inspect the file or test
- inspect git state
- use any already-supplied logs or context before re-reading blindly

### 3. Keep the fix narrow

Solve one dominant failure at a time:

- use the smallest useful proving command first
- only escalate to a bigger build/test pass after the local failure is addressed
- if a command keeps failing with the same signature, stop broad retries and narrow scope

Use the verification profile taxonomy from the active AGENTS.md/core rules. Terminal Ops owns evidence execution, not profile definitions:

- state the selected profile before editing
- run the smallest proof command that bounds the risk
- escalate to a broader command only when the smaller proof cannot answer the risk

Do not run `make test`, `make fmt`, or equivalent whole-repo commands by reflex. Use them when the profile calls for them, before PR/push when available, or when no smaller command can bound the risk.

### 4. Report exact execution state

Use exact status words:

- inspected
- changed locally
- verified locally
- committed
- pushed
- blocked

## Output Format

```text
SURFACE
- repo
- branch
- requested mode

EVIDENCE
- failing command / diff / test

ACTION
- what changed

STATUS
- inspected / changed locally / verified locally / committed / pushed / blocked
```

## Pitfalls

- do not work from stale memory when the live repo state can be read
- do not widen a narrow fix into repo-wide churn
- do not use destructive git commands
- do not ignore unrelated local work

## Verification

- the response names the proving command or test
- the response distinguishes targeted proof from full-suite/PR gate proof
- git-related work names the repo path and branch
- any push claim includes the target branch and exact result
