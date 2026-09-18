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
| User-owned choice: domain judgment, acceptable error costs, material tradeoff, authority | User or their designated domain owner | Recommend an option, explain its consequence, and await the required answer |

Do not ask the user to choose what the repository already establishes. Do not treat
"local", "demo", "simple", or "prototype" as permission to fabricate unspecified
capabilities. Identify which behavior is real, simulated, or explicitly deferred.
If an earlier assistant proposed reducing scope and received no answer, retain the
original requirement and leave that optional proposal unaccepted. Do not force the
user to reconfirm an explicit requirement. Investigate missing inputs and continue
independent work; ask only for information or a decision actually needed next.

Frame interview questions around observable consequences, not architecture jargon.
Explain what the evidence establishes, what remains undecided, and which work the
answer changes. Offer two or three distinct suggested choices, with the recommendation
first; preserve a free-text answer. Stop interviewing once the consequential choices
are settled. Do not transfer routine engineering responsibility to the user or invent
a domain answer to keep implementation moving. If technical investigation cannot
resolve feasibility, report that limit and ask only about the resulting scope or
tradeoff; user preference is not technical proof.

Keep each question to one decision; do not bundle a material tradeoff with blanket
approval of the whole proposal. Make the choice understandable in the question
itself without opening a document. After the answer, record its consequence and
ask the next necessary question or resume the authorized work.

## Present one concise proposal

Use an existing brief rather than generating a document per phase. Establish:

1. The journey and required outcomes, with observable acceptance and its source.
2. Existing capabilities: what will be reused or adapted, its consumers, and why
   any apparently suitable implementation is rejected. Trace behavior, not just names.
3. Owners and indicative paths for domain decisions, state, external effects, and
   shared UI behavior. Name who calls whom; distinguish modules from processes.
4. A representative input/output example at each consequential shared boundary,
   including unsupported/failure outcomes. For persistent workflows, show the order
   of state changes and effects, who commits them, and what retry or editing means.
5. Trace a required change through the proposed owners: what changes, what should
   stay unchanged, and why the simpler alternative cannot provide that isolation.
   Include frontend consumers and their distinct policy when shared UI is needed.
6. Applicable verification. When consequential uncertainty remains, name the first
   proof, its budget/stopping condition, and the dependent work its result permits.
   State what independent work can proceed while evidence is missing.
7. For UI creation/redesign, screen-preview images grounded in selected design
   references, following the [frontend guidance](frontend-architecture.md#design-preview-and-agreement).
   Map the proposed journeys to implementor proof and independent regression QA.

Keep this scoped to decisions that affect consumers or acceptance, not every helper
or endpoint. A small table or worked example in the existing brief is enough; do
not create a document per boundary. The proposal should let an implementor follow
one user action through its owners without inventing another architecture.

Present the proposed source tree separately in Markdown, with a short responsibility
annotation on every listed folder and file; show it in the conversation and retain it
in the existing brief. Cover application composition, feature
behavior, shared UI/state, domain decisions, I/O and proof entrypoints where present;
do not invent a folder for each category. Omit generated files and routine dependency
contents. For existing applications, show only the affected structure and mark
reused, added or changed paths. The tree proposes ownership; it is not an instruction
to create empty scaffolding or a permanent folder convention.

For each consequential boundary, accompany the tree with compact metadata:
owned decisions/state; public operation and input/output meaning; callers and allowed
dependencies; responsibilities deliberately kept outside; and the required change
that justifies separation. Include shared frontend consumers and distinguish local
draft state from persisted state. Simple path annotations need no duplicate table.

Generate the ImageGen diagram as a global view of the application: core capabilities,
responsibility boundaries and their interactions. Name concepts, not folders, files
or every internal helper. Group implementation details behind their owning abstraction;
retain boundaries whose decisions affect other components. Show human decisions,
runtime/deployment boundaries, external systems and durable stores where relevant.
Label directed interactions with operations or data contracts; distinguish control
from data flow where their directions differ. Broad boxes such as “frontend” or
“backend” may frame the view but cannot hide consequential responsibility boundaries.
Keep the mapping from these conceptual owners to source paths in the Markdown tree
or metadata, not in the image. The two views must agree without matching box-for-file.

Verify the rendered image by tracing the worked normal and failure case through it:
can the reader locate each policy decision, state change, external call and retry
owner? Does it agree with the tree and contract metadata? Correct omissions as well
as contradictions. Neither image polish nor file count establishes architecture quality.

Use the main skill's interview and agreement checkpoint. Present the proposal and
image before requesting agreement so the user can assess concrete consequences.
Do not substitute a generic “May I continue?” for an unresolved decision. Recommend
reversible library and folder choices rather than interviewing about each. Once
the proposal's consequential choices are settled and agreement is established,
proceed autonomously within scope. Reopen them only when new evidence
invalidates the commitment or changes authority, scope, or acceptance.

For an existing application, preserve settled choices and present only the affected
boundaries. Do not require a new diagram or interview for an ordinary isolated edit.

## Choose abstractions by responsibility

Name the concept or invariant a boundary owns and the requested change it isolates.
An independently tunable detector may need its own input/output contract even with
one implementation. A trivial route may call a store directly. Neither requires a
generic framework, one service per entity, or a predefined number of layers.

Show the separation in the call flow: domain policy receives the facts it needs
and returns a decision; the application operation owns sequencing; adapters perform
external I/O and persistence. Keep these as functions in one module when sufficient.
Extract a boundary when a required policy change would otherwise spread through
HTTP, SQL, or unrelated UI consumers. Keep transaction ownership coherent. Moving
the same coupled logic to another file or adding pass-through classes is not proof.

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

Choose the cheapest meaningful proof of the most consequential uncertainty before
expanding dependent work. For independently tunable behavior, establish its callable
operation and evaluation entry point together; use the same domain implementation
and relevant configuration as the application. Then exercise its real consumer. Use
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
