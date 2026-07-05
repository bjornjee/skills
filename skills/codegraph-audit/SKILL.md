---
name: codegraph-audit
description: Use on demand before opening a PR when the local codegraph CLI is installed — pulls the call-graph slice touched by the diff, then dispatches the strict reviewer with that context loaded.
---

# /skills:codegraph-audit — Repo-context PR review (local)

## Why this skill exists

Language-strict reviewers (`go-reviewer-strict`, `python-reviewer-strict`) look only at the changed file. They miss bugs whose root cause lives in a caller, callee, type definition, or import they never read. This skill plugs that hole: before passing the diff to a strict reviewer, it loads the minimum slice of the call graph that the diff touches, so the reviewer reasons over the full blast radius.

## Trigger

On-demand only — this skill is not auto-invoked by any dispatch rule. Run `/skills:codegraph-audit` (minimal mode, scoped to the diff) or `/skills:codegraph-audit full` (whole-repo mode) when you want a call-graph-aware review before a PR — most useful for diffs that touch shared functions, interfaces, or types with many callers.

## Prerequisite check

Run `codegraph --version`. If it fails, halt and print:

> codegraph is not installed. Install with:
>   `curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh`
> Then retry. See https://github.com/colbymchenry/codegraph for details.

Do **not** auto-install — install is the user's call.

## Argument parsing

Single optional positional arg.

| Arg | Mode |
|---|---|
| (none) | `minimal` |
| `full` | walk the entire graph |
| anything else | halt with usage line |

## Index handling

The local `.codegraph/` index persists between runs (faster than rebuilding). Add it to repo-root `.gitignore` once if not already there — the skill never commits it.

```bash
if [ ! -f .codegraph/codegraph.db ]; then
  codegraph init
  codegraph index
else
  codegraph sync  # incremental update against the working tree
fi
```

## Workflow — minimal mode (default)

1. **Resolve the diff base.** Use `git merge-base HEAD origin/main` (or `origin/master` if main doesn't exist) as the base SHA. Diff with `git diff --name-only <base> HEAD`. Filter to source files (drop `.md`, `.txt`, `.yml`, lockfiles, generated files). If empty after filtering, emit `APPROVE` with empty findings and exit.

2. **Resolve symbols per file.** For each changed file, in parallel:
   ```bash
   codegraph query "<file>" --json
   ```

3. **Pull the 1-hop context bundle.** For each touched symbol, in parallel:
   ```bash
   codegraph impact "<symbol>" --json
   codegraph callers "<symbol>" --json
   codegraph callees "<symbol>" --json
   ```
   Concatenate into a JSON object keyed by symbol — the **context bundle**.

4. **Dispatch the strict reviewer subagent.** Pick by file extension among the changed set:
   - Any `.go` files → spawn `go-reviewer-strict` (`agents/go-reviewer-strict.md`)
   - Any `.py` files → spawn `python-reviewer-strict` (`agents/python-reviewer-strict.md`)
   - Otherwise → apply Layer-1 generic principles inline (those agents' shared rules)

   Model: `sonnet` (matches the agent files' frontmatter). Pre-load the context bundle into the subagent prompt:

   ```
   You are reviewing a pre-PR change. The user has already loaded the
   codegraph context bundle below — use it to reason about callers,
   callees, and impact. If a symbol isn't in the bundle, it's not in
   the blast radius.

   <diff>
   {git diff <base> HEAD}
   </diff>

   <codegraph-context>
   {context bundle JSON}
   </codegraph-context>

   Apply your normal review contract (Layer 1 + Layer 2 + output format).
   ```

5. **Aggregate.** Collect findings using the strict reviewer's `[SEVERITY] / Layer / File / Evidence / Fix` contract.

## Workflow — full mode (`/skills:codegraph-audit full`)

Same as minimal with two changes:

- Skip step 1; enumerate every symbol via `codegraph query --all --json`.
- Prepend this banner to the output so the cost trade-off is visible:
  > **Mode: `full`** — walked the entire graph. This is expensive; prefer the default for routine PRs.

## Output format

Emit a single markdown document. End with:

```
## Review Summary

| Severity | Count |
|----------|-------|
| BLOCK    | 0     |
| FLAG     | 0     |
| INFO     | 0     |

Verdict: APPROVE | WARNING | BLOCK
```

- **APPROVE** — no BLOCK or FLAG findings. The orchestrator proceeds to `/agent-dashboard:pr`.
- **WARNING** — only FLAG/INFO findings. Orchestrator surfaces them and proceeds.
- **BLOCK** — at least one BLOCK finding. Orchestrator halts; do **not** proceed to PR creation until the user acknowledges or fixes.

## Reuse, don't duplicate

The strict reviewer agents (`agents/go-reviewer-strict.md`, `agents/python-reviewer-strict.md`) are the **single source of truth** for review rules. This skill orchestrates context-gathering and dispatch; it does not restate Layer 1 principles, Layer 2 rules, or the output contract. If the rules need to change, change them in the agent files.

## Anti-patterns

- **Auto-installing codegraph if missing.** Install is the user's call — print instructions and halt.
- **Committing the `.codegraph/` index.** It belongs in `.gitignore`. The skill never `git add`s it.
- **Inlining the strict-reviewer rules into this skill.** Spawn the agents, do not fork their prompts. Drift kills the doctrine.
- **Reaching out to a remote API.** Codegraph is local-only by design; this skill respects that and never makes network calls of its own.
- **Skipping the codegraph step because it feels slow.** The whole point is the call-graph slice; without it, this skill is just a normal review.
- **Skipping the audit because the diff "looks small".** Small diffs in critical paths are exactly where context-aware review pays off.
