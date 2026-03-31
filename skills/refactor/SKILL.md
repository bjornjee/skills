---
name: refactor
description: Safely restructure code with test-preserved, incremental transformations
disable-model-invocation: true
---

Safely refactor code while preserving all existing behavior.

Refactoring goal: $ARGUMENTS

## Instructions

Follow these phases in order. Each phase has a gate — do not proceed until the gate is satisfied. Apply all project rules and conventions that are in your context.

---

### Phase 1: Branch Setup

1. Derive a short kebab-case name from the refactoring goal.
2. Fetch the latest main branch: `git fetch origin main`
3. Create a new branch from origin/main: `git checkout -b refactor/<name> origin/main`
   - If the branch already exists, ask the user whether to resume it (`git checkout refactor/<name>`) or choose a new name.
4. Confirm the branch: `git branch --show-current`

**Gate:** On the correct `refactor/<name>` branch, based on latest origin/main.

---

### Phase 2: Scope

1. Parse the refactoring goal — what is being restructured and why?
2. Identify all affected files by searching the codebase for the code to be changed and its dependents.
3. Check test coverage for the affected code — what tests exist? What is untested?
4. If test coverage is insufficient for safe refactoring, **tell the user** and suggest writing tests first before refactoring.

**Gate:** The scope is clear. Affected files and their test coverage are identified.

---

### Phase 3: Baseline

1. Run `make test` to establish a passing baseline.
2. If tests fail, **stop and report**. Do not refactor on a broken codebase. Suggest using `/fix` first.
3. Record the test output as the regression baseline.

**Gate:** All tests pass. The baseline is established.

---

### Phase 4: Transform

Apply the refactoring in small, atomic steps. For each step:

1. Make a single, focused change (e.g., extract a function, rename a variable, move a file).
2. Run `make test` immediately after the change.
3. If tests fail:
   - Revert only the changed files (`git checkout -- <file1> <file2> ...`)
   - Analyze why it failed
   - Try a different approach
4. If tests pass, proceed to the next step.

Do not batch multiple changes between test runs. One change, one test run.

**Gate:** All transformations applied. All tests pass after each step.

---

### Phase 5: Cleanup

1. Remove dead code — unused imports, functions, variables, files.
2. Update any affected documentation or comments.
3. Run `make test` one final time.

**Gate:** No dead code remains. All tests pass.

---

### Phase 6: Review and Commit

1. Review all changes for correctness, security, and convention adherence.
2. Verify that behavior is preserved — no new features, no bug fixes, only structural changes.
3. Commit with a `refactor:` conventional commit message that describes what was restructured and why.

**Gate:** Clean commit with conventional message. Behavior is unchanged. No critical or high-severity review issues.
