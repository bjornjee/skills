---
name: observability
description: Use when adding logging, metrics, tracing, alerts, or SLOs to a service — structured-log contracts, RED metrics, trace propagation, symptom-based alerting.
---
# Observability

You can't fix what you can't see, and you can't see what you logged as prose. Rules for making services debuggable at 3am by someone who didn't write them.

## Logs
- Structured only: `slog` (Go), `structlog`/`logging` with JSON (Python), never `fmt.Println`/`print` in production paths.
- Canonical keys, spelled the same everywhere: `request_id`, `tenant_id`, `user_id`, `duration_ms`, `error`. A grep for `request_id` must find every service's logs.
- One wide event per request at the boundary (method, route, status, duration, caller) beats twenty breadcrumb lines inside it.
- Log the *decision*, not just the outcome: "rejected: rate limit 100/60s exceeded (count=142)" — the reader needs why.
- Never log secrets, tokens, or full request bodies containing PII. Redaction is at the logging boundary, not the caller's discretion.
- Levels mean things: ERROR pages someone eventually; WARN is actionable on inspection; INFO is the request narrative; DEBUG is off in prod.

## Metrics
- RED per endpoint/consumer before any custom metric: Rate, Errors, Duration (histogram, not average — p50/p95/p99).
- Labels are low-cardinality: route templates not raw URLs, status classes not codes, never user ids. Cardinality explosions kill the metrics store.
- Every queue: depth + oldest-message age. Every pool (DB, workers): in-use vs capacity.
- Counters for events, gauges for states, histograms for durations. A "duration gauge" is a lie about the past.

## Tracing
- Propagate context (W3C traceparent / OTel) across **every** boundary: HTTP, gRPC, queue messages, background jobs. A span that dies at a queue is a bug — inject/extract on both sides.
- Span the units of work you'd want to blame: handler, DB call, external call. Not every function.
- Attach `request_id` to logs from trace context so logs ↔ traces cross-link both ways.

## Alerts & SLOs
- Define the SLO before the dashboard: "99.5% of checkout requests under 800ms over 30 days" is actionable; "low latency" is not.
- Alert on symptoms (SLO burn rate, error ratio, queue age), not causes (CPU, memory). Causes page for things users never felt.
- Every alert has an owner and a next action. An alert nobody acts on gets deleted, not muted.
- Two burn-rate windows (fast: page, slow: ticket) beat static thresholds.

## When NOT to apply
CLIs and short-lived scripts: stderr + exit codes are the contract; skip metrics/tracing. Internal tools below ~weekly usage: logs only. The no-secrets rule applies everywhere, always.
