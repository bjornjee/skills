# Technical-sharing mode

Use this mode for architecture stories, engineering proposals, implementation reviews,
incident learnings, system deep dives, and technical enablement. It supplies story and
diagram doctrine, not a visual brand. Apply the style/template selected in the brief.

## Audience and outcome

For mixed infrastructure and backend audiences, support three readings:

- infrastructure: ownership, routing, runtime boundaries, failure modes, rollback;
- backend: contracts, deterministic inputs, idempotency, testability, evidence;
- leadership or adjacent teams: impact, implementation complexity, tradeoffs, and how
  reusable systems multiply team value.

Replace these readings when the user's audience differs. Start from evidence and the
decision the audience must understand, not from a fixed slide count or layout.

## Story architecture

For every candidate slide, define:

1. conclusion or decision;
2. evidence and source;
3. constraint, tension, or tradeoff;
4. owner and authority boundary;
5. failure consequence or rollback;
6. audience action or takeaway.

A short technical talk often follows: outcome, context, system map, critical mechanism,
implementation boundaries, proof, tradeoffs, operations/rollback, impact, and close.
Merge, reorder, or replace these stages when the selected story requires it. Do not
collapse a meaningful runtime, ownership, or failure boundary merely to hit a count.

For release-confidence or CI/CD assurance stories, use the separately routed reference
example. Do not load or borrow that flow for unrelated technical talks.

## Value-bearing technical visuals

Choose a visual that proves the key relationship:

- closed loop for feedback and continuous assurance;
- parallel analysis with one writer for bounded authority;
- candidate routing for selector behavior and coherent service topology;
- cross-runtime proof for browser, API, worker, and native-host boundaries;
- state transition for promotion, audit, and rollback;
- ownership swimlane for orchestration versus deterministic logic and publishing;
- comparison or decision table for alternatives and tradeoffs.

Use concrete labels such as `exact diff`, `candidate graph`, `gate passed`, `router
weights`, or `normalized evidence`. Avoid generic boxes named `AI`, `system`, or
`data` unless the slide defines them. Keep labels short; move explanation into native
annotations, speaker notes, or an adjacent slide.

## Evidence discipline

- Distinguish observed fact, design decision, proposal, and future state.
- Bind claims to a revision, run, measurement window, or cited source when relevant.
- Show where model judgment ends and deterministic validation or authority begins.
- Make limits visible: caps, timeouts, release lanes, cleanup, fail-closed behavior,
  and rollback preconditions.
- Show implementation complexity honestly; do not present orchestration, native-host
  proof, routing, or cleanup as a decorative one-line arrow.
- Express multiplication through reusable contracts, frameworks, catalogs, and
  feedback loops rather than claiming automation simply removes people.

Do not copy reference-specific customer names, product names, hostnames, schedules,
measurements, or internal paths into future decks unless they are authoritative
evidence for the current presentation.
