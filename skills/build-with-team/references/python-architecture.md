# Python: capability ownership and composition

Use when Python application behavior must be reusable, independently tunable, or
separated from transport and persistence. Preserve coherent existing structure.
A function or module can provide the boundary; a class hierarchy is not required.

## Observed structure: KPJ

Selected paths from `sales-kpj-privacy` at `d02b69c`:

```text
src/kpj_privacy/
  backend/
    app.py                 HTTP host and injected application dependencies
    composition.py         Constructs configured pipeline implementations
    runtime.py             Runtime startup and cleanup
    routes/
  privacy_pipeline/
    workflow.py            Domain input/output types and component contracts
    redaction/
      service.py           Bounded application operations
      registry.py          Resolves supported workflows
      models.py
      policy.py
      transform.py
      adapters/
  inference/
  evaluation/              Runners and metrics outside HTTP handling
```

The actual dependency trace is:

```text
backend composition -> configured redactor -> Pipeline(..., redactor)
backend application -> redaction service -> selected workflow
evaluation runners  -> pipeline/redaction implementations and domain types
```

`Pipeline` receives a transcriber, diarizer, transcript validator, and redactor.
Composition constructs an `OPFRedactor` with a supplied prediction callable, policy
configuration, model specification, and runtime provenance. Evaluation imports these
capabilities without importing the HTTP application. These contracts carry domain
meaning; they are not interfaces created solely to satisfy a folder convention.

This demonstrates where model/runtime selection belongs and how a capability can
be evaluated separately. It does not establish the accuracy of any model or justify
copying KPJ's remote deployment options into a local application.

## Observed structure: car inspection

The `enriched_review` capability at `3be2132` keeps its responsibilities together:

```text
backend/app/
  main.py                  Selects and composes implementations
  enriched_review/
    router.py              HTTP/auth translation
    service.py             Review operations
    store.py               Persistence
    models.py              Review input/output structures
    intelligence.py        Intelligence contract and explicit demo double
    codex_intelligence.py  Model-backed implementation
    worker.py              Job execution and output validation
```

`main.py` selects intelligence and supplies it to `IntelligenceWorker(store,
intelligence)`. The worker reads a snapshot, invokes intelligence, validates record
and evidence identity, and persists the result. The router obtains the review
service instead of owning model-provider behavior.

Extract the responsibility boundaries, not its worker infrastructure. A synchronous
operation may need no job queue. The deterministic double includes fixed evaluation
values; those are rehearsal fixtures, not measured quality. Neither source project
is a blanket endorsement of every existing module or its size.

## When separation is necessary

- Independent tuning requires a domain contract even with one implementation. Its
  result must express supported, unsupported, failed, and negative outcomes where
  consumers act differently; a list of successes alone may lose necessary meaning.
- Substantial workflow policy belongs outside HTTP request objects and status codes.
  Keep boundary validation at entrypoints and domain invariants with their owner.
- External clients and implementation selection belong at composition boundaries.
  Supply dependencies to behavior; avoid hidden clients or startup work on import.
- Give SQL, transaction lifetime, and external effects explicit ownership. Read a
  bounded input snapshot before external analysis, then validate current state and
  persist; do not extend a write transaction across a slow provider call by accident.
- Let capabilities own their types and operations. Share types when consumers need
  the same meaning, not merely similar fields. A trivial CRUD route can remain direct.

## Counterexample and proof

Putting `classify(text)` in its own file is insufficient if its HTTP caller still
owns severity policy, provider versions, model-specific output interpretation, and
procurement decisions. Moving that caller unchanged into `service.py` does not fix it.

For required independent tuning, invoke the domain operation from an evaluation or
batch entrypoint without starting the server. Substitute the relevant implementation
at composition and exercise meaningful result/error cases without editing unrelated
routes, persistence policy, or presentation. A test double proves wiring; the real
integration and domain evaluation establish their separate claims. Do not create
another implementation solely to demonstrate hypothetical flexibility.

Keep existing proof tooling. For packaged delivery, verify imports from the installed
artifact; a `src/<package>` layout is an option, not an instruction to reorganize.

## Source provenance

Selected structures and dependency traces were inspected, not executed as a fresh
application trial. The explanation above is self-contained; links are optional evidence.

- KPJ [workflow](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/src/kpj_privacy/privacy_pipeline/workflow.py), [composition](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/src/kpj_privacy/backend/composition.py), and [evaluation](https://github.com/deploy-co/sales-kpj-privacy/blob/d02b69cb47eae74634074237640676fa6ca1ecc2/src/kpj_privacy/evaluation/runners.py).
- Car inspection [composition](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/backend/app/main.py), [contract](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/backend/app/enriched_review/intelligence.py), and [worker](https://github.com/deploy-co/sales-car-inspection-demo/blob/3be2132217494afd2e0f19a5fd81daee546b394c/backend/app/enriched_review/worker.py).
