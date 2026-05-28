# codegraph-audit

Repo-context-aware PR review that runs automatically in CI. Builds an ephemeral [codegraph](https://github.com/colbymchenry/codegraph) index for the PR, pulls the slice of the call graph touched by the diff, and runs a strict Claude review with that context — catching issues that file-by-file reviewers miss because they never read the callers, callees, or types involved.

## What ships in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt invoked by the workflow. Tells Claude how to query codegraph, dispatch to the strict reviewer, and format findings. |
| `ci/codegraph-audit.yml` | Reusable GitHub Actions workflow template. Copy into your repo's `.github/workflows/`. |
| `README.md` | This file. |

## How to adopt in your repo

1. **Copy the workflow.** Drop `ci/codegraph-audit.yml` into your repo at `.github/workflows/codegraph-audit.yml`.
2. **Add the secret.** Repo Settings → Secrets and variables → Actions → add `ANTHROPIC_API_KEY`.
3. **Open a PR.** The workflow runs on `opened | synchronize | reopened`. It posts findings as a PR comment and fails the check on a `BLOCK` verdict.

No plugin install required in the runner — the workflow fetches `SKILL.md` from `bjornjee/skills` over raw HTTP at run time and passes it to `claude --print` as a system prompt.

## Modes

| Mode | When | Cost |
|---|---|---|
| `minimal` (default) | Every PR push, automatically | Cheap — indexes once, queries only diff symbols + 1-hop neighbors |
| `full` | Manual via Actions → Run workflow → mode: full | Expensive — walks the whole graph |

## Cost drivers

- **Codegraph index build** — runtime scales with repo size, typically seconds to a couple of minutes.
- **Claude API tokens** — the context bundle (diff + symbol impact/callers/callees JSON) is the dominant input cost. `full` mode multiplies this.
- **Runner time** — the YAML caps the job at 20 minutes (`timeout-minutes: 20`); raise if your repo is large.

## Local fallback

None. This skill is CI-only by design. If you want a local pre-push audit, install codegraph yourself and run the CLI directly against your working tree — the equivalent of what the workflow does.

## Pinning

The workflow fetches `SKILL.md` from the `main` branch of `bjornjee/skills`. To pin to a specific version, edit the `Fetch codegraph-audit skill prompt` step in your copy of the workflow and replace `main` with a tag or commit SHA.
