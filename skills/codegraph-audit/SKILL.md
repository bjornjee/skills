---
name: codegraph-audit
description: Use on demand before opening a PR when the local codegraph CLI is installed — pulls the call-graph slice touched by the diff, then dispatches the strict reviewer with that context loaded.
---

# /skills:codegraph-audit — Repo-context PR review (local)

## Why this skill exists

Language-strict reviewers inspect the full declared change and implicated callers. A code graph can additionally reveal dependencies that textual review might miss. This skill plugs that hole: before passing the diff to a strict reviewer, it loads the minimum slice of the call graph that the diff touches, so the reviewer reasons over the full blast radius.

## Trigger

On-demand only — this skill is not auto-invoked by any dispatch rule. Run `/skills:codegraph-audit` (minimal mode, scoped to the diff) or `/skills:codegraph-audit full` (whole-repo mode) when you want a call-graph-aware review before a PR — most useful for diffs that touch shared functions, interfaces, or types with many callers.

## Prerequisite check

Run `codegraph --version`. If it fails, halt and print:

> codegraph is not installed. Install with:
>   `curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh`
> Then retry. See https://github.com/colbymchenry/codegraph for details.

Do **not** auto-install — install is the user's call.

## Argument parsing

Optional mode plus an explicit review scope from the caller. Record base, tip, and whether local tracked/untracked work is included; these are review inputs, not arguments to guess for the codegraph CLI.

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

1. **Resolve the review scope.** Honor caller-supplied base/tip and file list. For a PR without a base, discover the repository default branch and resolve its merge-base with the selected tip. Include staged and unstaged changes plus `git ls-files --others --exclude-standard` when local work is requested. Record the exact diff commands and exclusions. Keep the complete file list for review; use source files for graph queries but still review manifests, CI, and relevant docs directly. An empty graph query is not an APPROVE verdict for excluded changes.

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
   - Any `.ts`, `.tsx`, `.js`, `.mjs`, or `.cjs` files → spawn `typescript-reviewer-strict` (`agents/typescript-reviewer-strict.md`)
   - Otherwise → apply Layer-1 generic principles inline (those agents' shared rules)

   Model: `sonnet` (matches the agent files' frontmatter). Pre-load the context bundle into the subagent prompt:

   ```
   You are reviewing a pre-PR change. The user has already loaded the
   codegraph context bundle below — use it to reason about callers,
   callees, and impact. If a symbol is missing, its relevance is not
   proven absent; the graph may be incomplete or stale. Inspect implicated callers where the supplied evidence requires it.

   Review scope: <base SHA>, <tip SHA>, <local inclusion>, <complete file list and exclusions>

   <diff>
   {complete caller-scoped base-to-tip diff, plus requested local tracked diffs and untracked file contents}
   </diff>

   <codegraph-context>
   {context bundle JSON}
   </codegraph-context>

   Apply your normal review contract (Layer 1 + Layer 2 + output format).
   ```

5. **Aggregate.** Collect findings using the strict reviewer's `[SEVERITY] / Authority / File / Evidence / Fix` contract.

## Workflow — full mode (`/skills:codegraph-audit full`)

Same as minimal with two changes:

- Retain step 1's caller-scope resolution. Replace step 2's per-file symbol discovery with `codegraph query --all --json`; a wider graph does not change the review's base/tip or local-file scope.
- Prepend this banner to the output so the cost trade-off is visible:
  > **Mode: `full`** — walked the entire graph. This is expensive; prefer the default for routine PRs.

## Output format

Emit a single markdown document. End with:

```
## Review Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| LOW | 0 |

Verdict: APPROVE | WARNING | BLOCK
```

- **APPROVE** — no defects remain. The orchestrator uses the available authorized PR workflow; agent-dashboard is optional.
- **WARNING** — only disclosed medium/low findings remain. Apply core doctrine's requirements for resolving or disclosing these findings before proceeding through the authorized PR workflow.
- **BLOCK** — at least one critical/high finding. Orchestrator halts; do **not** proceed to PR creation until it is fixed.

## Reuse, don't duplicate

The strict reviewer agents (`agents/go-reviewer-strict.md`, `agents/python-reviewer-strict.md`) are the **single source of truth** for review rules. This skill orchestrates context-gathering and dispatch; it does not restate Layer 1 principles, Layer 2 rules, or the output contract. If the rules need to change, change them in the agent files.

## Anti-patterns

- **Auto-installing codegraph if missing.** Install is the user's call — print instructions and halt.
- **Committing the `.codegraph/` index.** It belongs in `.gitignore`. The skill never `git add`s it.
- **Inlining the strict-reviewer rules into this skill.** Spawn the agents, do not fork their prompts. Drift kills the doctrine.
- **Reaching out to a remote API.** Codegraph is local-only by design; this skill respects that and never makes network calls of its own.
- **Skipping the codegraph step because it feels slow.** The whole point is the call-graph slice; without it, this skill is just a normal review.
- **Skipping the audit because the diff "looks small".** Small diffs in critical paths are exactly where context-aware review pays off.
