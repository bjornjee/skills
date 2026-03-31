---
name: fix
description: Diagnose and fix a bug with reproduce-first, test-first methodology
disable-model-invocation: true
---

Diagnose and fix a bug.

Bug description: $ARGUMENTS

## Instructions

Follow these phases in order. Each phase has a gate — do not proceed until the gate is satisfied. Apply all project rules and conventions that are in your context.

---

### Phase 1: Branch Setup

1. Derive a short kebab-case name from the bug description.
2. Fetch the latest main branch: `git fetch origin main`
3. Create a new branch from origin/main: `git checkout -b fix/<name> origin/main`
   - If the branch already exists, ask the user whether to resume it (`git checkout fix/<name>`) or choose a new name.
4. Confirm the branch: `git branch --show-current`

**Gate:** On the correct `fix/<name>` branch, based on latest origin/main.

---

### Phase 2: Gather Evidence

Before touching code, collect **grounded evidence** from observable sources. Do not guess from reading code alone.

1. Take the bug description — this may be an error message, stack trace, issue URL, or user description.
2. Collect evidence from these sources (check all that are available):
   - **Logs:** application logs, server logs, error tracking (Sentry, Datadog, etc.). Ask the user where logs live if not obvious.
   - **Metrics:** dashboards, monitoring, performance counters. Ask for links or screenshots.
   - **Stack traces:** the full trace, not just the top frame. Include line numbers and timestamps.
   - **Steps to reproduce:** exact inputs, environment, and sequence that triggers the bug.
   - **Git history:** `git log --oneline --since="2 weeks ago" -- <affected files>` — what changed recently in the area?
   - **Issue tracker:** if an issue URL was provided, read it fully including comments for additional context.
3. Summarize the evidence. State what is **known** (from logs/metrics/traces) vs what is **hypothesized**.

**Gate:** At least one source of grounded evidence (log, trace, metric, or reproducible steps) is collected. Do not proceed on hypothesis alone.

---

### Phase 3: Reproduce (RED)

1. Using the evidence from Phase 2, write a **failing test** that reproduces the bug. The test should:
   - Replicate the exact conditions from the evidence (inputs, state, sequence)
   - Target the specific behavior that is broken
   - Fail for the right reason (matching the observed error, not a typo or import error)
   - Be minimal — test only the broken behavior
2. Run `make test` and confirm the new test **fails**.
3. Compare the test failure output against the evidence from Phase 2 — the failure should match the observed bug (same error type, same behavior). If it doesn't, the test is wrong, not the code.
4. Show the failing test output to the user.

**Gate:** A test exists that fails, reproducing the bug. The failure matches the observed evidence.

---

### Phase 4: Diagnose

Root cause analysis must be grounded in the evidence and the failing test, not speculation from reading code.

1. Trace the code path **from the failing test** to identify where the behavior diverges from what is expected.
2. Cross-reference with git history: `git log -S "<relevant term>"` and `git bisect` if the bug is a regression.
3. Identify the root cause — explain:
   - What the code **does** (observed via test failure and logs)
   - What it **should do** (expected behavior from evidence)
   - **Why** it diverges (the specific line or logic that causes the mismatch)
4. Present the diagnosis to the user for confirmation. Include evidence citations (log lines, metric values, test output) — not just "I read the code and think X."

**Gate:** User agrees with the root cause analysis. Diagnosis cites observable evidence.

---

### Phase 5: Fix (GREEN)

1. Implement the **minimal fix** — change only what is necessary to fix the bug.
2. Run `make test` — the previously failing test must now **pass**.
3. Run the full test suite via `make test` — no regressions.
4. Show the passing test output.

**Gate:** The reproducing test passes. The full test suite passes. No unrelated changes.

---

### Phase 6: Refactor

1. Review the fix — is there a cleaner way to express it? Unnecessary duplication?
2. If changes are needed, make them and run `make test` to confirm tests still pass.
3. If no refactoring is needed, skip this phase.

**Gate:** Tests pass via `make test`. Code is clean.

---

### Phase 7: Review and Commit

1. Review all changes for correctness, security, and convention adherence.
2. Commit with a `fix:` conventional commit message that describes what was fixed and why.

**Gate:** Clean commit with conventional message. No critical or high-severity review issues.
