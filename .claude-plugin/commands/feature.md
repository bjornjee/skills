Start a new feature in an isolated git worktree.

Feature description: $ARGUMENTS

## Instructions

Follow these steps exactly:

### 1. Create the worktree

- Derive a short name from the feature description in kebab-case (e.g. `voice-car-diagnosis`)
- Branch name: `feat/<name>` (e.g. `feat/voice-car-diagnosis`)
- Worktree directory: `../worktrees/feat-<name>` (e.g. `../worktrees/feat-voice-car-diagnosis`)
- Run: `git worktree add -b feat/<name> ../worktrees/feat-<name> main`

### 2. Copy environment and settings files

Copy these from the original project root into the new worktree:

- All `.env*` files: `cp .env* ../worktrees/feat-<name>/`
- Claude local settings: `mkdir -p ../worktrees/feat-<name>/.claude && cp .claude/settings.local.json ../worktrees/feat-<name>/.claude/settings.local.json`

### 3. Switch to the worktree

- `cd` into `../worktrees/feat-<name>`
- Confirm the working directory and branch with `pwd` and `git branch --show-current`

### 4. Enter plan mode

- Enter plan mode to research and design the feature implementation
- Do NOT write any code until the plan is approved
- Follow the standard development workflow (TDD, code review) after plan approval
