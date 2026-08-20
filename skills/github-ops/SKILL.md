---
name: github-ops
description: Use for GitHub repo operations via the gh CLI — issue triage, PR and CI management, releases, Dependabot — plus CODEOWNERS, reusable workflows, and monorepo path filtering. For operational tasks beyond plain git.
---

# GitHub Operations

Manage repositories for CI reliability, community health, and contributor experience. Everything here is a `gh` CLI command or a workflow-config pattern.

## Codex Cloud PR publication

In Codex Cloud only, the worker edits, verifies, reviews its diff, and prepares
the PR title/body. It must not use `gh`, direct GitHub credentials, repository
secrets, `git push`, or `/opt/codex` publication helpers. Use the configured
Codex–GitHub capability outside the worker, record its PR URL, and leave merging
to a separate explicit authorization. The `gh` instructions below retain their
existing behavior outside Codex Cloud.

## Issue triage

**Types:** bug, feature-request, question, documentation, enhancement, duplicate, invalid, good-first-issue
**Priority:** critical (breaking/security), high (significant impact), medium (nice to have), low (cosmetic)

Read title + body + comments → search for a duplicate → label → act (answer questions, request a repro for under-specified bugs, link the original on duplicates).

```bash
gh issue list --search "keyword" --state all --limit 20   # dedup before triaging
gh issue edit <n> --add-label "bug,high-priority"
gh issue comment <n> --body "Thanks — could you share reproduction steps?"
```

## PR management

Review order: CI status → mergeable → age / last activity → tests-and-conventions for community PRs. Flag any PR older than 5 days with no review.

```bash
gh pr checks <n>                          # CI state
gh pr view <n> --json mergeable,reviewDecision,updatedAt
```

### Stale policy

- Issues idle 14+ days: add `stale`, comment asking for an update.
- PRs idle 7+ days: comment asking if still active.
- Auto-close stale issues after 30 days of silence (add `closed-stale`).

Compute cutoffs relative to *now* — never hardcode a date that rots:

```bash
# PRs untouched for 30+ days (jq derives the cutoff from now)
gh pr list --json number,title,updatedAt \
  --jq '.[] | select(.updatedAt < (now - 86400*30 | strftime("%Y-%m-%dT%H:%M:%SZ")))'
```

## CI/CD operations

On failure: read the failing step, decide flaky vs real, fix the root cause — don't blind-rerun.

```bash
gh run list --status failure --limit 10
gh run view <run-id> --log-failed        # jump straight to the failing step
gh run rerun <run-id> --failed           # only after you know it's flaky
```

## Release management

Green main → review merged PRs → generate notes → tag.

```bash
# Merged since last month — BSD/macOS date; on GNU/Linux use --date='-1 month'
gh pr list --state merged --base main --search "merged:>$(date -v-1m +%Y-%m-%d)"
gh release create v1.2.0 --title "v1.2.0" --generate-notes
gh release create v1.3.0-rc1 --prerelease --title "v1.3.0 RC1"
```

## Security monitoring

```bash
gh api repos/{owner}/{repo}/dependabot/alerts --jq '.[].security_advisory.summary'
gh api repos/{owner}/{repo}/secret-scanning/alerts --jq '.[].state'
gh pr list --label "dependencies" --json number,title
```

Auto-merge safe bumps; escalate critical/high advisories immediately; sweep alerts weekly.

## CODEOWNERS

Lives in `.github/CODEOWNERS`. Each line is `path-pattern  @owner…` using gitignore glob syntax.

- **Last matching rule wins** — put specific rules *after* general ones, never before.
- **Fallthrough owner:** a leading `*  @org/maintainers` line guarantees every path has an owner; tighter rules below override it.
- Ownership only *blocks* merges when branch protection enables "Require review from Code Owners". Without that toggle, CODEOWNERS merely auto-requests reviewers.

```
*                   @org/maintainers      # fallthrough owner
/docs/              @org/writers          # docs team owns docs
/infra/*.tf         @org/platform         # last match wins over the two above
```

## Reusable CI: workflows vs composite actions

| | Reusable workflow | Composite action |
|---|---|---|
| Reuse unit | Whole **job(s)** | A block of **steps** inside a job |
| Invoked at | Job level (`uses:` under a job) | Step level (`uses:` in `steps:`) |
| Secrets | `secrets: inherit` or pass explicitly | Inherits the caller job's env; no secrets block |
| Declared by | `on: workflow_call` | `runs.using: "composite"` |

Reach for a **reusable workflow** to share a whole pipeline (build + test + deploy) across repos; a **composite action** to share a step sequence (setup-lang → cache → install) inside one job. **Version-pin shared workflows and actions to a full commit SHA** (`uses: org/repo/.github/workflows/ci.yml@<sha>`) — a floating `@main` lets one upstream change break every consumer at once.

## Monorepo path filtering

Skip a whole workflow when the touched paths don't matter:

```yaml
on:
  push:
    paths: ["services/api/**", ".github/workflows/api.yml"]
```

For per-job gating inside one workflow, run `dorny/paths-filter` and branch on its boolean outputs.

**The required-check trap:** a path-filtered required check that gets *skipped* posts no status, so the PR blocks forever waiting on a check that will never report. Fixes: (a) keep the check required but add a no-op job of the **same name** that reports success on the filtered-out paths, or (b) drop it from required checks and lean on GitHub's merge-queue / expected-status config instead. Never mark a path-filtered job required without one of these.

## Quality gate

Before calling a GitHub task done:
- every triaged issue carries appropriate labels
- no PR older than 7 days without a review or comment
- CI failures investigated, not just re-run
- releases ship accurate changelogs
- security alerts acknowledged and tracked
