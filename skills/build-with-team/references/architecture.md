# Architecture decisions and proof

Use for a new application or a change whose mistakes would propagate across features,
consumers, or persistent state. The main skill owns the checkpoints; this reference
explains how to establish their evidence. Follow core rules for verification profiles,
irreversible decisions, security, migrations, and rollback.

## Investigate before interviewing

Inspect the actual user journey and existing owners of data, rules, UI behavior,
and external integrations. Read representative callers and tests, not just directories.
Distinguish reusable capability from superficially similar code and obsolete decisions.
For a supplied scaffold, inspect working implementations as well as its README;
placeholders express intent but do not establish behavior.

Separate three kinds of uncertainty:

| Unknown | Who resolves it | Next action |
| --- | --- | --- |
| Discoverable fact: existing API, component, dataset, deployment constraint | Codex | Inspect the source or run a bounded investigation |
| Technical hypothesis: contract sufficiency, model quality, performance | Codex with evidence | Design a representative experiment and stopping condition |
| User-owned choice: required capability, acceptable tradeoff, authority | User | Recommend an option, explain its consequence, and await the required answer |

Do not ask the user to choose what the repository already establishes. Do not treat
"local", "demo", "simple", or "prototype" as permission to fabricate unspecified
capabilities. Identify which behavior is real, simulated, or explicitly deferred.
If an earlier assistant proposed reducing scope and received no answer, retain the
original requirement and leave that optional proposal unaccepted. Do not force the
user to reconfirm an explicit requirement. Investigate missing inputs and continue
independent work; ask only for information or a decision actually needed next.

## Present one concise proposal

Use an existing brief rather than generating a document per phase. Establish:

1. The journey and required outcomes, with observable acceptance and its source.
2. Existing capabilities to reuse and the actual gaps.
3. Responsibility and state ownership, including domain types and invariants.
4. Shared contracts: inputs, outputs, failure/unsupported outcomes, and dependency direction.
5. The consequential alternative and why the proposed boundary fits better.
6. Uncertain assumptions, affected consumers, and the first slice that can invalidate them.

Show the responsibility/data-flow diagram required by the main skill. Include where
human judgment, external effects, and durable state sit. It should help the user
assess the decisions; a folder tree or attractive image alone does not do that.

Ask the next unresolved consequential question through suggested choices. Recommend
from evidence, not the ease of implementation. Obtain agreement on material product
tradeoffs and architectural commitments; prior agreement counts. Once these are
settled, proceed autonomously within scope. Reopen them only when new evidence
invalidates the commitment or changes authority, scope, or acceptance.

For an existing application, preserve settled choices and present only the affected
boundaries. Do not require a new diagram or interview for an ordinary isolated edit.

## Choose abstractions by responsibility

Name the concept or invariant a boundary owns and the requested change it isolates.
An independently tunable detector may need its own input/output contract even with
one implementation. A trivial route may call a store directly. Neither requires a
generic framework, one service per entity, or a predefined number of layers.

| Pressure visible in the task | Useful separation | Evidence |
| --- | --- | --- |
| A capability must be tuned independently | Domain contract and implementation, composed by the host | Evaluate or substitute it without changing unrelated consumers |
| Multiple screens need consistent behavior | Shared component with consumer-specific policy outside it | Both consumers import it and exercise their distinct states |
| Workflow policy mixes with HTTP or SQL | Owned application operation with explicit side effects | Exercise policy without reconstructing a server or duplicating rules |
| Resource lifetime crosses screens or tasks | One lifecycle owner | Entry, interruption, exit, and re-entry avoid duplicate or leaked resources |
| Several steps must maintain one state invariant | One owner and transaction boundary | Failure/concurrency checks preserve the invariant |

Contracts should represent what consumers need to know. Unknown, unsupported,
unassessed, failed, and successfully negative results must remain distinguishable
where they lead to different user actions. Preserve evidence identity and provenance
when downstream decisions depend on them. Do not invent confidence values to fill
a schema or equate catalog membership with verified applicability.

Keep deployment choices and external implementations at composition boundaries.
Do not hold a database write transaction across an external model call merely
because the original in-process stub was fast; establish operation identity, state
validation, and transaction ownership for the actual execution model.

## Prove the design with the capability

Choose a small end-to-end slice through the most consequential uncertainty. Use
representative inputs and independently justified expected results. Follow applicable
domain guidance for metrics, dataset separation, error costs, and runtime limits.
If authoritative labels are missing, prepare candidate cases and questions for the
appropriate owner; do not promote the candidate's outputs to ground truth.

Verify both whether the capability works and whether its boundary supports the
requested independent change. A fake can prove wiring, but cannot prove real model
quality, media support, provider failure behavior, or external integration. Preserve
the distinction in the brief and worker assignments.

Parallelize work only where its assumptions are sufficiently established or its
provisional nature is explicit and bounded. Failed proof changes the plan; it does
not automatically change the required outcome. Diagram approval is not proof of
feasibility, and review approval is not a substitute for this slice.
