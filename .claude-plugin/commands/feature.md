Start a new feature in an isolated git worktree.

Feature description: $ARGUMENTS

## Instructions

Follow these phases in order. Each phase has a gate — do not proceed until the gate is satisfied.

---

### Phase 1: Setup

1. Derive a short kebab-case name from the description
2. Create branch `feat/<name>` and worktree `../worktrees/feat-<name>` from main
3. Copy `.env*` and `.claude/settings.local.json` into the worktree (if they exist)
4. cd into the worktree and confirm with `pwd` and `git branch --show-current`

**Gate:** Working directory is the new worktree on the correct branch.

---

### Phase 2: Environment

Auto-detect project type from project files:

| Signal | Type |
|--------|------|
| `react-native` in package.json dependencies | Mobile |
| `next`, `vite`, or `webpack` in package.json | Web |
| `requirements.txt`, `pyproject.toml`, or `setup.py` | Python |
| `go.mod` | Go |
| `Dockerfile` or `docker-compose.yml` | Containerized |

Confirm the detected type with the user. Set up the development environment
appropriate for the project type — install dependencies, configure ports,
create emulators/simulators as needed.

For projects with large data directories (datasets, evals, model artifacts):
symlink them from the original repo into the worktree rather than copying.
Scan for directories matching common patterns (`data/`, `datasets/`, `evals/`,
`models/`, `artifacts/`) and symlink any that exist in the source repo.

**Gate:** Dependencies installed. Data directories symlinked. Dev environment ready to run.

---

### Phase 3: Plan

Research the codebase and design the implementation approach.

**Gate:** User has approved the approach. No code has been written yet.

---

### Phase 4: Implement

Build the feature following the workflow rules (tests first, then implementation).

**Gate:** All tests pass. Implementation matches the approved plan.

---

### Phase 5: Review

Review all changes for correctness, security, and convention adherence.

**Gate:** No critical or high-severity issues remain.

---

### Phase 6: Deliver

Commit changes and prepare for merge.

**Gate:** Clean commit history with conventional commit messages.

---

### Phase 7: Cleanup (on merge)

Triggered when the user indicates the feature has been merged upstream.

1. Verify the branch is merged (warn if unmerged commits remain)
2. Tear down any environment resources created in Phase 2
3. Remove worktree and delete branch
4. Confirm cleanup is complete
