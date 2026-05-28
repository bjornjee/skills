---
name: codegraph-audit
description: Repo-context-aware code audit run from CI on every PR. Uses the local codegraph CLI to pull the slice of the call graph touched by the diff (or the full graph with `full`), then runs a strict review over that context so issues are caught automatically. Invoked headlessly by the codegraph-audit GitHub Actions workflow template (see `ci/codegraph-audit.yml`), not by humans.
---

# /skills:codegraph-audit — Repo-context PR review

## Why this skill exists

Language-strict reviewers (`go-reviewer-strict`, `python-reviewer-strict`) look only at the changed file. They miss bugs whose root cause lives in a caller, callee, type definition, or import they never read. This skill plugs that hole: before passing the diff to a strict reviewer, it loads the minimum slice of the call graph that the diff touches, so the reviewer reasons over the full blast radius.

Fully automated. The skill runs in CI on every PR — humans do not invoke it.

## Invocation contract

This skill is invoked headlessly by `ci/codegraph-audit.yml` (a sibling file in this same skill directory) running in GitHub Actions. The workflow guarantees the following preconditions; **do not re-check them, do not re-install, do not re-index**:

| Provided by CI | Detail |
|---|---|
| `codegraph` on `$PATH` | Installed in a prior workflow step |
| `.codegraph/codegraph.db` exists in CWD | Built by the workflow via `codegraph init && codegraph index` |
| `MODE` env var | `minimal` (default) or `full` |
| `BASE_SHA` env var | PR base commit (e.g. `main` tip) |
| `HEAD_SHA` env var | PR head commit |
| Full git history available | `actions/checkout@v4` with `fetch-depth: 0` |

If any precondition is missing, halt with a one-line error citing the missing var and exit non-zero. **Do not attempt recovery** — CI owns setup; recovering here would mask workflow bugs.

## Workflow — minimal mode (`MODE=minimal`, default)

1. **Enumerate changed files.**
   ```bash
   git diff --name-only "$BASE_SHA" "$HEAD_SHA"
   ```
   Filter to source files (drop `.md`, `.txt`, `.yml`, lockfiles, generated files). If the diff is empty after filtering, emit `APPROVE` with an empty findings table and exit zero.

2. **Resolve symbols per file.**
   For each changed file, in parallel:
   ```bash
   codegraph query "<file>" --json
   ```
   Capture the list of symbols defined in that file.

3. **Pull the 1-hop context bundle.**
   For each touched symbol, in parallel:
   ```bash
   codegraph impact "<symbol>" --json
   codegraph callers "<symbol>" --json
   codegraph callees "<symbol>" --json
   ```
   Concatenate into a single JSON object keyed by symbol. This is the **context bundle**.

4. **Apply the strict reviewer rules.**
   The CI workflow appends the language-strict reviewer prompts to your system prompt (`go-reviewer-strict.md`, `python-reviewer-strict.md`). Apply them **inline** — do not attempt to spawn a subagent; in the CI runner the bjornjee/skills plugin is not installed and those agent names are not registered. Pick the rule set by file extension among the changed set:
   - Any `.go` files → apply the `go-reviewer-strict` rules
   - Any `.py` files → apply the `python-reviewer-strict` rules
   - Otherwise → apply only the shared Layer-1 generic principles (the ones both reviewers list)

   **Reviewer prompt template:**
   ```
   You are reviewing a PR. The user has already loaded the codegraph
   context bundle below — use it to reason about callers, callees, and
   impact. Do not request more context; if a symbol isn't in the bundle,
   it's not in the blast radius.

   <diff>
   {git diff $BASE_SHA $HEAD_SHA}
   </diff>

   <codegraph-context>
   {context bundle JSON}
   </codegraph-context>

   Apply your normal review contract (Layer 1 + Layer 2 + output format).
   ```

5. **Aggregate.** Collect findings from the reviewer using its existing `[SEVERITY] / Layer / File / Evidence / Fix` contract.

## Workflow — full mode (`MODE=full`)

Same as minimal, with two changes:

- Skip step 1; instead, enumerate every symbol via `codegraph query --all --json`.
- Prepend this banner to the output so the PR comment makes the cost obvious:
  > **Mode: `full`** — walked the entire graph. This is expensive; prefer `minimal` for routine PRs.

## Output format

Emit a single markdown document. The CI workflow uploads it verbatim as a PR comment and parses the verdict line to decide whether to fail the check.

```
## codegraph-audit (mode: <minimal|full>)

<one or more findings, each formatted per the strict reviewer's contract>

[SEVERITY] Short title
Layer:    1 (generic principle #N: <name>) | 2 (project rule from <file>: "<quote>")
File:     path/to/file.ext:42-51
Evidence: <≤6 lines from the diff or context bundle>
Fix:      <≤4 lines of concrete change>

---

## Review Summary

| Severity | Count |
|----------|-------|
| BLOCK    | 0     |
| FLAG     | 0     |
| INFO     | 0     |

Verdict: APPROVE | WARNING | BLOCK
```

- **APPROVE** — no BLOCK or FLAG findings; CI step exits 0.
- **WARNING** — only FLAG/INFO findings; CI step exits 0 but the comment is posted.
- **BLOCK** — at least one BLOCK finding; CI step exits non-zero, failing the check.

## Reuse, don't duplicate

The strict reviewer agents (`agents/go-reviewer-strict.md`, `agents/python-reviewer-strict.md`) are the **single source of truth** for review rules. This skill orchestrates context-gathering and dispatch; it does not restate Layer 1 principles, Layer 2 rules, or the output contract. If the rules need to change, change them in the agent files — not here.

## Anti-patterns

- **Re-installing codegraph or rebuilding the index inside the skill.** CI owns install and indexing. If they're missing, fail loudly — don't paper over a broken workflow.
- **Persisting `.codegraph/` across runs.** The index is ephemeral by construction (each CI runner is a fresh checkout). The skill must not write outside the workspace or attempt to cache anything.
- **Inlining the strict-reviewer rules into this skill.** Spawn the agents, do not fork their prompts. Drift kills the doctrine.
- **Re-checking preconditions "to be safe".** The workflow already guarantees them. Double-checking just hides bugs in the workflow when they happen.
- **Asking the reviewer to gather more context.** The whole point of pre-loading the codegraph bundle is to make the review a single-shot. If the reviewer wants more, the bundle is too small — fix the scope here, not by giving the reviewer tools.
- **Posting the PR comment from inside this skill.** The CI workflow handles comment delivery via `actions/github-script`. This skill emits markdown to stdout; CI does the rest.

## Local invocation

There is none. If you want a local pre-push audit, run codegraph CLI yourself against the working tree. A local-mode follow-up is out of scope for this skill.
