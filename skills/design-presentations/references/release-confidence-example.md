# Release-confidence technical-sharing example

Load this example only for release-confidence, CI/CD assurance, candidate validation,
promotion/rollback, or closely related stories. It is a completeness checklist, not
presentation-specific copy. Include only stages supported by current evidence.

| Stage | Required evidence or mechanism | Decision the audience should understand |
| --- | --- | --- |
| Deterministic review input | Exact base/head diff plus minimum sanitized repository context | Review is grounded in the change under consideration. |
| Five review personas | Reliability, architecture, code quality, testing, and security perspectives, all read-only | Diverse analysis creates candidate findings, not publishing authority. |
| Three deterministic security scans | Semgrep, OSV, and Shai-Hulud results bound to the same revision | Deterministic scanners complement model review and reduce variance. |
| Ground and validate | Changed line, evidence, severity, remediation, and uncertainty | Only validated findings cross the publication boundary. |
| Bounded publication | One idempotent summary publisher and a strict inline-comment cap | Review remains useful, non-duplicative, and safe to rerun. |
| Smoke-test discovery | Root and nearest `AGENTS.md`, repository structure, plans/docs, and actual API/UI/worker surfaces | Coverage intent comes from repository-owned sources. |
| Reusable smoke framework | Stable descriptor/catalog, product scenario, execution library, and infrastructure orchestrator | Teams author assertions once instead of rebuilding runners. |
| Test catalog | IDs, target, runtime class, release lane, bounded timeout, dependencies, evidence, and cleanup | Every test has an explicit execution and evidence contract. |
| Candidate on every release | Immutable candidate artifact and exact release metadata invoke the matching catalog | The gate proves what may be promoted, not a nearby build. |
| Browser proof | Playwright routes the exact candidate, waits for semantic readiness, asserts user-visible behavior, and captures bounded evidence | HTML presence is not user readiness. |
| Windows/native proof | Versioned artifact/checksum, scoped transfer, VM lease/bootstrap, native execution, evidence upload, and cleanup | Desktop confidence must cross the native-host boundary. |
| Coherent candidate graph | Main reverse proxy routes by automation header or sticky browser cookie into one pinned candidate microservice graph | Candidate tests see one coherent system while normal traffic remains active. |
| Gate evaluation | Revision-bound evidence is evaluated against explicit policy | Promotion depends on the exact candidate's proof. |
| Promotion and rollback | Desired traffic weights switch to the deployed graph; inverse weights restore active traffic | Release and rollback are fast, idempotent traffic decisions, not rebuilds. |
| Continuous assurance | Scheduled browser, API/integration, Windows, and security depth normalize evidence and route failures to an owner | Confidence continues after promotion and improves the next change. |

## Story spine

A compact flow can move through outcome, context, complete confidence loop, review and
validation, repository-owned test discovery/reuse, candidate proof, routing,
promotion/rollback, scheduled assurance, and compounding team value. Merge or split
stages according to evidence density and talk length; do not hide runtime or authority
boundaries merely to reduce slide count.

## Visual questions

- How does one exact change move through parallel read-only analysis to one bounded
  publication boundary?
- How does a candidate remain coherent across browser/API and Windows/native proof?
- How does the main proxy select the candidate graph without affecting normal traffic?
- What revision-bound evidence admits promotion, and how do inverse weights roll back?
- How does scheduled assurance route failures to an owner and improve the next change?

Apply the active style/template profile. Do not assume DeployCo styling unless the
presentation brief independently selects it.
