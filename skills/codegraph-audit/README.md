# codegraph-audit

Repo-context-aware PR review that runs **locally** in your existing Claude Code session, just before `/agent-dashboard:pr` opens the PR. Pulls the slice of the call graph touched by the diff using a local [codegraph](https://github.com/colbymchenry/codegraph) index, then runs a strict review with that context — catching issues that file-by-file reviewers miss because they never read the callers, callees, or types involved.

No CI required. No API keys required (uses your existing Claude Code subscription auth).

## What ships in this directory

| File | Purpose |
|---|---|
| `SKILL.md` | The skill prompt invoked by the orchestrator before PR creation. |
| `README.md` | This file. |

## How adoption works

1. **Install codegraph** once on your machine:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh
   ```
2. **Add `.codegraph/` to your repo's `.gitignore`** so the local index doesn't get committed.
3. That's it. The orchestrator auto-invokes `/skills:codegraph-audit` before `/agent-dashboard:pr` per the dispatch row in `.claude/rules/core.md`. If you don't have codegraph installed when the audit runs, it halts with install instructions — install and re-run.

## Modes

| Invocation | When | Cost |
|---|---|---|
| auto (default `minimal`) | Every `/agent-dashboard:pr` run | Cheap — index is incremental, queries only diff symbols + 1-hop neighbors |
| `/skills:codegraph-audit` | Manual minimal review | Same as above |
| `/skills:codegraph-audit full` | When you want a whole-repo audit | Expensive — walks the entire graph |

## How the verdict gates the PR

- **APPROVE** — orchestrator proceeds to `/agent-dashboard:pr`.
- **WARNING** — findings surface; orchestrator proceeds.
- **BLOCK** — orchestrator halts. Acknowledge or fix before retrying.

## Index management

The local `.codegraph/` index persists between runs (re-indexing every PR is too slow locally). The skill runs `codegraph sync` to update it incrementally against the working tree. If the index is missing, it runs `codegraph init && codegraph index` once.

To force a full rebuild: `rm -rf .codegraph/` and let the next audit re-init.

## Why not CI?

CI execution was the original design but requires `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` for a Codex equivalent) which not all setups have. The local path uses your existing Claude Code subscription auth — no keys needed. If you later get CI keys, a CI workflow could be re-added as a follow-up.
