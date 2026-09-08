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

For the selected PR, review CI status, mergeability, relevant activity, and
tests/conventions. Apply the repository's age-based rules within an authorized
maintenance scope.

```bash
gh pr checks <n>                          # CI state
gh pr view <n> --json mergeable,reviewDecision,updatedAt
```

### Stale maintenance (when authorized)

- Use the repository's configured inactivity periods, labels, messages, and
  closure policy.
- Comment, label, close, or reopen only on objects included in the user's
  authority for the maintenance run.

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

For dependency updates and alerts, inspect the selected items and follow the
repository's merge and maintenance policy. Auto-merge, alert sweeps, comments,
and closures require user authorization covering those operations and objects;
repository policy does not broaden a narrow task's scope.

## CODEOWNERS

Lives in `.github/CODEOWNERS`. Each line is `path-pattern  @owner…` using [GitHub's CODEOWNERS pattern syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), which differs from gitignore syntax for negation, character ranges, and escaped leading `#`.

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

Keep a required workflow triggered for pull requests. Determine path relevance
inside it, then conditionally run relevant jobs; a job skipped by `jobs.<id>.if`
reports success, while a path-filtered workflow may leave a required check
pending.

```yaml
on:
  pull_request:
  # Add `merge_group:` when this repository uses merge queues.
```

For per-job gating inside one workflow, run `dorny/paths-filter` and branch on
its boolean outputs. A final required gate that depends on conditional jobs
must run with `if: ${{ always() }}` (or equivalent), verify path detection
succeeded, and require `success` in `needs.<job>.result` for every relevant job.
Failure, cancellation, or an unexpectedly skipped relevant job must not pass.

If the repository uses merge queues, include `merge_group` in required workflow
triggers and verify queue runs as well as pull-request runs. Do not remove a
required test merely to avoid a pending check.

## Quality gate

Before calling a GitHub task done, check only criteria relevant to the requested
operation and selected objects. For example: a triage task verifies its labels;
a CI task investigates its failures; a release task verifies its notes. Stale
durations, automatic maintenance, and auto-merge are repository policy, not
universal completion criteria.
