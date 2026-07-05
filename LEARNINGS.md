# LEARNINGS

Settled decisions this repo litigated more than once. Strict reviewers load this file as Layer-2 evidence; treat each entry as a pattern known to have caused real churn here. Re-opening one of these requires new evidence, not new taste.

## 1. Hooks live in agent-dashboard, never in this plugin
**Churn ended:** #45 moved hook registration out; CURATION.md records the policy; skills (safety-guard, strategic-compact) later needed corrective PRs because they *described* hook behavior this plugin cannot ship.
**Rule:** this plugin is pure configuration — zero hooks. Enforcement wiring belongs to agent-dashboard (`test-gate`, `warn-destructive`, `block-main-commit`). Skills may document optional manual wiring, clearly labeled as such.

## 2. codegraph-audit is on-demand, not a hard pre-PR dispatch
**Churn ended:** three states across #60/#75 — CI-driven → local hard-dispatch → on-demand. The hard dispatch silently couldn't fire without the third-party `codegraph` CLI installed.
**Rule:** a mandatory gate whose tooling may be absent is false confidence. codegraph-audit stays on-demand; do not restore the dispatch row.

## 3. This repo is canonical for doctrine; home-dir copies are synced, never edited
**Churn ended:** #53 (and repeat confusion before it). `~/.claude/rules/*` are symlinks via `make sync-rules`; `~/.codex/AGENTS.md` is copied via `make sync-codex-rules`.
**Rule:** edit here, bump, sync. Editing a destination copy is a bug.

## 4. Plan mode = `EnterPlanMode`/`ExitPlanMode`, never the `Plan` agent
**Churn ended:** litigated in #52–#54 and again in the parity wave (#71). The recurring trap is the naming clash — a `Plan` agent exists and sounds right.
**Rule:** user shorthand "plan it" always resolves to the plan-mode tools; the `Plan` agent's output is invisible to the dashboard's plan surfaces.

## 5. Codex delegation requires `--write` and `-C/--cwd`
**Churn ended:** discovered across five same-day PRs (#47–#51). Codex defaults to a read-only sandbox in the wrong directory.
**Rule:** every Codex dispatch carries both flags. If codex-delegate is ever rewritten, these are the two invariants that were paid for in production.

## 6. Version bumps are three-file atomic — use `make bump`
**Churn ended:** 100 manual touches across history on `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`; the Codex manifest silently drifted six minor versions before the lockstep test existed.
**Rule:** `make bump V=<x.y.z>` writes all three manifests; `scripts/codex-marketplace.test.js` enforces they agree. Remaining prose-only gap: nothing verifies a bump *happened* when behavior changed vs the base branch — candidate for a CI diff-vs-base check.

## 7. `.codex/AGENTS.md` is Codex-canonical doctrine, symmetric to `.claude/rules/core.md`
**Churn ended:** removed in #58, deliberately re-added in #75/#76. The removal read the file as dead weight; it is the only always-on surface Codex has.
**Rule:** doctrine changes land in BOTH files in the same PR (cross-adapter drift is an explicit review checklist item). Do not remove either.

## 8. core.md owns the Surgical/Targeted/Full taxonomy
**Churn ended:** #74 plus a tdd-guide drift incident where the agent's inline redefinition of "Surgical" diverged from core.md.
**Rule:** skills, agents, and workflow plugins reference the profile taxonomy; they never redefine it. Any file restating a profile definition is a bug.

## 9. Always-on gates stay in core.md; agent files are conditional context
**Churn ended:** #76's doctrine diet moved bug-fix state rules and test granularity into tdd-guide; the gate audit showed agent files only load when spawned, and "drive the implementation loop directly" is a sanctioned path — the rules silently left context.
**Rule:** a rule that must bind every session lives in core.md (compact form is fine); agent files may carry the fuller contract, never the only copy.
