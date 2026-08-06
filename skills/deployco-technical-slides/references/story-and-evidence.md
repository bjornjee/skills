# Story architecture and evidence

## Audience and outcome

Design for a short technical talk consumed by infrastructure and backend engineers,
with enough business context for adjacent stakeholders. Make three readings possible:

- infrastructure: ownership, routing, runtime boundaries, failure modes, rollback;
- backend: contracts, deterministic inputs, idempotency, testability, evidence;
- leadership/adjacent teams: impact, implementation complexity, and how a reusable
  system multiplies team value.

Start from evidence, not slide layouts. For every candidate slide, write the claim,
supporting evidence, decision or tradeoff, owner, and consequence if the claim fails.

## Recommended short-talk spine

Adapt the count to the talk; a focused ten-minute deck commonly fits 12–16 slides.

1. Outcome: state the system-level promise and why it matters.
2. Context: show the change in scale or bottleneck that forced the design.
3. System map: show the complete confidence loop and ownership boundaries.
4. Prevent: ground automated review in deterministic inputs and bounded authority.
5. Discover: turn product changes into repo-owned coverage contracts.
6. Reuse: separate catalog, product scenario, execution framework, and deployment.
7. Gate: prove the exact release candidate across relevant runtimes.
8. Route: keep candidate traffic dark behind a stable public identity.
9. Promote: express release as an auditable, reversible traffic decision.
10. Assure: schedule depth, normalize evidence, route failures, and feed learning back.
11. Close: show how reusable confidence compounds delivery speed and team capacity.

Merge or split stages based on evidence density. Do not collapse a meaningful runtime
or ownership boundary merely to hit a slide count.

## Release-confidence reference chain

Use this as a technical completeness checklist, not presentation-specific copy.

| Stage | Required evidence or mechanism | Decision the audience should understand |
| --- | --- | --- |
| Deterministic review input | Exact base/head diff plus the minimum sanitized repository context | Model output is grounded in the change actually under review. |
| Five review personas | Reliability, architecture, code quality, testing, and security perspectives, all read-only | Diverse analysis produces candidate findings, not independent publishing authority. |
| Three deterministic security scans | Semgrep, OSV, and Shai-Hulud results bound to the same revision | Deterministic scanners complement model review and reduce variance. |
| Ground and validate | Changed line, concrete evidence, severity, actionable remediation, and uncertainty | Only validated, reviewable findings cross the publication boundary. |
| Bounded publication | One idempotent summary publisher and a strict cap on inline PR comments | Review remains useful, non-duplicative, and safe to rerun. |
| Smoke-test discovery | Root and nearest `AGENTS.md`, repository structure, plans/docs, and real API/UI/worker surfaces | Coverage intent comes from repo-owned sources of truth. |
| Reusable smoke framework | Stable descriptor/catalog, product-owned scenario, reusable execution library, and infra orchestrator | Teams author assertions once instead of rebuilding runners. |
| Test catalog | IDs, target, runtime class, release lane, bounded timeout, dependencies, evidence, and cleanup | Every selected test has an explicit execution and evidence contract. |
| Candidate on every release | Immutable candidate image/artifact and exact release metadata invoke the matching catalog | The gate proves what may be promoted, not a nearby build. |
| Browser proof | Playwright routes the exact candidate, waits for semantic readiness, asserts user-visible behavior, and captures progressive evidence | HTML presence is not user readiness. |
| Windows/native proof | Versioned artifact and checksum, scoped transfer, VM lease/bootstrap, native execution, evidence upload, cleanup | Desktop confidence must cross the native-host boundary. |
| Coherent candidate graph | Main reverse proxy routes by automation header or sticky browser cookie into one pinned candidate microservice graph | Candidate tests see a coherent system while normal traffic stays active. |
| Gate evaluation | Revision-bound evidence is evaluated against explicit gate policy | Promotion depends on the exact candidate’s proof. |
| Promotion and rollback | Desired traffic weights switch to the already deployed graph; inverse weights restore active traffic | Release and rollback are fast, idempotent traffic decisions, not rebuilds. |
| Continuous assurance | Scheduled browser, API/integration, Windows, and security depth normalize evidence and route failure to an owner | Confidence continues after promotion and improves the next change. |

## Slide claim pattern

Use this structure for technical content slides:

1. Conclusion title: a decision or outcome, not a topic label.
2. Boundary subtitle: the constraint that makes the conclusion true.
3. Value-bearing visual: the actors, state transition, branch, or feedback loop.
4. Exact annotations: short labels for authority, evidence, failure, and scale.
5. Takeaway: the tradeoff, invariant, or operational consequence.

Prefer a system diagram plus compact evidence over a decorative hero image. Use real
measurements only when sourced for the current deck; do not copy presentation-specific
counts, customer/product names, hostnames, schedules, or internal paths into future
decks.

## Evidence discipline

- Distinguish observed fact, design decision, and proposed future state.
- Bind claims to a revision, run, measurement window, or cited source when relevant.
- Show where model judgment ends and deterministic validation or authority begins.
- Make limits visible: caps, timeouts, release lanes, cleanup, fail-closed behavior,
  and rollback preconditions.
- Express multiplication through reusable contracts, frameworks, and evidence loops,
  not by claiming that automation simply removes people from the process.
