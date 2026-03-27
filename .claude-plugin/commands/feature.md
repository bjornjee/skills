Start a new feature in an isolated git worktree.

Feature description: $ARGUMENTS

## Instructions

Follow these phases in order. Each phase has a gate — do not proceed until the gate is satisfied.

---

### Phase 1: Setup

1. Derive a short kebab-case name from the description
2. Derive the app name from the git repo: `basename $(git rev-parse --show-toplevel)`
3. Create branch `feat/<name>` and worktree `../worktrees/<app>/<name>` from main:
   `mkdir -p ../worktrees/<app> && git worktree add ../worktrees/<app>/<name> -b feat/<name>`
4. **From the source repo root** (before cd'ing), copy environment files into the worktree:
   - List `.env*` files in the source repo: `ls .env* 2>/dev/null` — note which files exist
   - Copy them: `cp .env* ../worktrees/<app>/<name>/`
   - If `.claude/settings.local.json` exists: `mkdir -p ../worktrees/<app>/<name>/.claude && cp .claude/settings.local.json ../worktrees/<app>/<name>/.claude/`
5. cd into the worktree and confirm with `pwd` and `git branch --show-current`
6. Verify: run `ls .env* 2>/dev/null` in the worktree. If the source repo had `.env*` files and none appear here, **halt and report failure**. If the source repo had no `.env*` files, note that explicitly.

**Gate:** Working directory is the new worktree on the correct branch. If `.env*` files existed in the source repo, they are all present in the worktree.

---

### Phase 2: Plan

Start two tracks in parallel:

**Background — Environment setup:** Launch a background agent (`run_in_background: true`) to set up the dev environment. The agent must:

1. Auto-detect project type from project files (highest match wins):

   | Priority | Signal | Type |
   |----------|--------|------|
   | 1 | `react-native` in package.json dependencies | Mobile |
   | 2 | `next`, `vite`, or `webpack` in package.json | Web |
   | 3 | `requirements.txt`, `pyproject.toml`, or `setup.py` | Python |
   | 4 | `go.mod` | Go |
   | 5 | `Dockerfile` or `docker-compose.yml` | Containerized |

   Ask the user only if no signal matches.

2. Install dependencies appropriate for the project type (e.g. `pip install`, `npm install`, `go mod download`). Configure ports, create emulators/simulators as needed.
3. Symlink large data directories (`data/`, `datasets/`, `evals/`, `models/`, `artifacts/`) from the source repo rather than copying.
4. On success, write a sentinel file: `touch .env-setup-done`
   On failure, write the error: `echo "<error message>" > .env-setup-failed`

**Foreground — Planning:** Research the codebase and design the implementation approach. Do not wait for environment setup to finish.

**Gate:** User has approved the approach. No code has been written yet.

---

### Phase 3: Implement

**Pre-gate:** Check for `.env-setup-done` in the worktree root.
- If present: verify dependencies are installed (e.g. `node_modules/` exists, `pip list` succeeds, `go env GOPATH` works) and data symlinks resolve correctly.
- If `.env-setup-failed` exists: surface the error and halt.
- If neither file exists: the background agent is still running — wait for it to finish before proceeding.

Build the feature following the workflow rules (tests first, then implementation).

**Gate:** Environment ready. All tests pass. Implementation matches the approved plan.

---

### Phase 4: Review

Review all changes for correctness, security, and convention adherence.

**Gate:** No critical or high-severity issues remain.

---

### Phase 5: Deliver

Commit changes and prepare for merge.

**Gate:** Clean commit history with conventional commit messages.

---

### Phase 6: Cleanup (on merge)

Triggered when the user indicates the feature has been merged upstream.

1. Verify the branch is merged (warn if unmerged commits remain)
2. Tear down environment resources: remove symlinks, stop dev servers or emulators, delete `.env-setup-done`/`.env-setup-failed` sentinel files
3. Remove worktree and delete branch
4. Confirm cleanup is complete
