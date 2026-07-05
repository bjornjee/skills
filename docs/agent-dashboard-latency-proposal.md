# Proposal: four workflow-latency cuts in agent-dashboard's feature/fix/pr skills

Status: proposed (2026-07-05). Target repo: `bjornjee/agent-dashboard` (issues disabled there, so the proposal lives here — the doctrine repo whose workflow binds to those skills). Apply next time that repo is open for changes.

## Measured baseline (agent-dashboard 0.34.1)

| Flow | Serialized steps | User round-trips | Subagent spawns | `make test` runs |
|---|---|---|---|---|
| Small fix (fix → pr skill) | 22–26 | 2 | 2 | 3–7 |
| Medium feature (feature → pr skill) | 32–57 | 3 | 4–7 | **10–14** |

With a 10-minute suite, a medium feature spends 100–140 minutes waiting on tests alone.

## The four cuts (every quality gate preserved)

1. **pr skill: run Phase 3 (refactor-cleaner) ∥ Phase 4 (`make fmt`); gate both with the single Phase 5 `make test`.** Disjoint concerns (dead code vs whitespace); Phase 5 already catches regressions from both. Saves 0–2 conditional test runs and one serialization per PR.
2. **feature skill Phase 4: spawn all applicable language reviewers in one message.** Core doctrine already says "parallel by default"; the skill doesn't enforce it. Halves review wall time on multi-language diffs.
3. **feature/fix Phase 2: skip the background env agent when `.env-setup-done` exists and the lockfile is older than the sentinel.** The sentinel *is* the hygiene mechanism; a timestamp comparison is the correct reuse signal. Saves 60–300 s per task on active worktrees.
4. **feature skill dispatch probe: threshold ≥3 phases → ≥6.** The probe's own copy recommends inline for ≤4 phases; below ~6, context isolation doesn't pay for the user round-trip.

## Explicitly rejected (owner decision, 2026-07-05)

Widening the worktree skip beyond "literal typo" (e.g. to Surgical single-file edits) — rejected; the worktree gate stays strict. Do not resurrect without new evidence (see `LEARNINGS.md`).
