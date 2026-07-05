---
name: git-workflow
description: Use when choosing a branching strategy, hunting a regression with git bisect, running multi-worktree development, or configuring CODEOWNERS and merge queues — falsifiable conventions, not a git tutorial.
---
# Git Workflow

Owner conventions plus the principal-level moves a strong model gets wrong by default. Generic git — stash, config, undo, conflict markers, semver tags — is assumed known and omitted.

## Branching strategy
Pick one per repo. The table is the decision; the note is the judgment.

| Strategy | Adopt when | Cost if misapplied |
|---|---|---|
| GitHub Flow | Short-lived `feature/*` off `main`, PR, merge, deploy | The right default; branches living past a few days rot into merge hell |
| Trunk-based | Strong CI **and** feature flags, merging several times/day | Without flags, half-built work ships to `main` on every push |
| Long-lived (GitFlow) | Scheduled releases or several supported versions in the field | Pure overhead for continuous-deploy SaaS — the `develop` branch just adds a hop |

- Default to GitHub Flow. Escalate to trunk-based only once flags + CI exist; drop to GitFlow only when you actually ship parallel versions.
- `main` is always deployable and protected — no direct commits (owner hooks enforce this, below).

## Owner conventions
- Conventional commits, **no scopes**: `<type>: <description>`, type ∈ feat/fix/refactor/docs/test/chore/perf/ci. `feat(auth): …` is wrong here — write `feat: …`.
- One feature, one branch, one git worktree. Never stack unrelated work on a single branch.
- agent-dashboard-managed repos own their hooks (`test-gate`, `warn-destructive`, `block-main-commit`). Prefer them; do not hand-roll `.git/hooks` scripts that duplicate or fight them.

## History discipline
- Rebase your **own** feature branch onto `main` to stay current. **Never** rebase a branch others have based work on — it rewrites their history out from under them. Update pushed branches with `--force-with-lease`, never `--force`.
- Squash-merge when the PR is one logical change (the intermediate commits are noise). Merge-commit when the individual commits are each bisect-worthy and belong in permanent history.
- On protected branches, dismiss stale approvals on force-push — a re-review after a history rewrite is not optional.

## Bisect a regression
A test flipped red and you don't know which commit did it:
1. Write a self-contained script: exit `0` = good, `1` = bad, `125` = skip (commit won't build). Make it hermetic — pin deps inside the script. A non-hermetic build makes every bisect result a coin flip.
2. `git bisect start <bad> <good>` then `git bisect run ./check.sh`. Git binary-searches and prints the first bad commit.
3. Merge-heavy history: add `--first-parent` so bisect walks merges (the PRs), not every squashed-away intermediate commit.
4. No test to script? `git log -S'symbol'` (occurrence count changed) or `-G'regex'` (diff line matches) finds the introducing commit far cheaper than a full bisect.

## Multi-worktree discipline
- One branch per worktree — git refuses to check the same branch out twice, so this is enforced, not advisory.
- Per-worktree env and ports. **Never share build caches across worktrees**: most bake absolute paths and will corrupt the sibling tree's build.
- Worktrees share the repo's refs and stash — `git fetch` in one serves all; a stash pushed in one is visible in all.
- Removed a worktree directory by hand? `git worktree prune` clears the dangling admin entry so its branch is deletable again.

## CODEOWNERS + merge queue
- CODEOWNERS is path-based with **later-rules-win** fallthrough: put specific paths *after* general ones, or the general rule shadows them.
- Merge queue vs auto-merge: a queue serializes individually-green PRs and re-tests each against the others, catching semantic (not textual) conflicts. Adopt when >~5 devs merge daily; below that, auto-merge + required status checks is enough and cheaper.

## When NOT to apply
Solo throwaway repos and spikes skip worktrees, CODEOWNERS, and merge queues — commit to `main` and move on. The commit-message convention and "never rewrite shared history" still bind the moment a second person clones.
