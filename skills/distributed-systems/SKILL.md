---
name: distributed-systems
description: Use when work crosses process boundaries — queues, webhooks, background jobs, retries, multi-service writes. Idempotency, delivery semantics, and failure design rules.
---
# Distributed Systems

Rules for anything that leaves the process: queues, webhooks, cross-service calls, background jobs. The network will duplicate, reorder, delay, and drop — design for it or debug it forever.

## Delivery semantics
- Exactly-once delivery is a myth; exactly-once *processing* is your job. Every consumer is idempotent by design: a dedupe key (message id / idempotency key checked against a store) or a naturally idempotent operation (`SET status='paid'`, not `balance += x`).
- At-least-once is the default assumption for every queue, webhook, and retry path. If processing twice is unsafe and there is no dedupe key, the design is not done.
- Ordering is per-partition/per-key at best, never global. If correctness needs order, key the stream by the entity and version the state.

## Retries
Retry = all four, or don't retry:
1. Exponential backoff with **full jitter** (thundering herds are self-inflicted).
2. A retry **budget** (max attempts or max elapsed), not infinite optimism.
3. **Deadline propagation** — the retry loop respects the caller's remaining deadline; retrying past it burns capacity for an answer nobody awaits.
4. Retry only **retryable** errors (timeouts, 429, 5xx). Retrying a 400 is a loop, not resilience.

## Multi-system writes
- Dual-write (DB + queue/second store in one request path) is a bug: one succeeds, one fails, state diverges. Use the outbox pattern — write the event to an outbox table in the same transaction, relay it asynchronously.
- Sagas over distributed transactions: each step has a compensating action; the coordinator persists progress so a crash resumes, not restarts.
- Read-your-own-writes across services is not guaranteed. If the UX requires it, serve the read from the writer or carry the write in the response.

## Failure handling
- Poison messages: max N attempts (name N), then dead-letter queue + alert. Infinite redelivery turns one bad message into an outage.
- Every external call has a timeout shorter than the caller's timeout. Missing timeout = infinite timeout = worker-pool exhaustion.
- Backpressure over buffering: bounded queues that reject/shed beat unbounded queues that OOM an hour later.
- Circuit-break outbound dependencies that are down — failing fast preserves your own capacity. Adopt a library; don't hand-roll the state machine.

## Time & coordination
- Never compare wall clocks across machines. Use versions, sequence numbers, or single-writer authority for ordering decisions.
- Leases and locks carry TTLs and fencing tokens; a lock whose holder can die without expiry is a deadlock with extra steps.

## Observability hooks (minimum)
- Queue depth and oldest-message age are the first alerts to wire — they leading-indicate almost every consumer failure.
- Every message carries a correlation id from the originating request; a trace that dies at a queue boundary is a bug.

## When NOT to apply
Single-process, single-DB apps: skip outbox/saga machinery — a transaction already gives you atomicity. The retry and timeout rules still apply to every external call.
