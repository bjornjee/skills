---
name: api-design
description: Use when designing or reviewing an HTTP/RPC API surface — resource modeling, pagination, error envelopes, versioning, idempotency. Falsifiable contracts, not style preferences.
---
# API Design

Rules for any API another team, service, or future-you will call. Every rule here is checkable in review.

## Resources
- Nouns, not verbs: `POST /orders`, not `POST /createOrder`. Verbs allowed only for true actions with no resource representation (`POST /orders/{id}/cancel`).
- One resource, one canonical URL. Aliases and "convenience" routes multiply cache keys and auth checks.
- Nested paths max two levels (`/orders/{id}/items`). Deeper nesting means the child deserves a top-level resource.

## Pagination
- Cursor-based for any dataset that mutates or can exceed ~10k rows. Offset pagination on mutable data skips/duplicates rows mid-scroll — that is a bug, not a style choice.
- Offset is acceptable for small, effectively-immutable datasets (admin lists, lookups).
- The cursor is opaque to clients (base64 of sort key + id). Documenting its internals turns it into API surface.
- Every list response carries `next_cursor` (null = end). No "call until empty page" contracts.

## Errors
- One error envelope repo-wide, RFC 7807 shape: `{ "type", "title", "status", "detail", "instance" }`. A second error shape anywhere is a BLOCK in review.
- Machine-readable `type` (stable URI/slug), human-readable `detail`. Clients branch on `type`, never parse `detail`.
- 404 vs 403 leak rule: if the caller may not know the resource exists, return 404 for both missing and forbidden. Returning 403 confirms existence.
- Validation failures: 422 with a per-field errors array inside the envelope, not the first error only.

## Versioning
- Additive-only within a major version: new optional fields and new endpoints are safe; renaming, retyping, or removing anything is breaking.
- Breaking change ⇒ new major path (`/v2/`) + deprecation window on v1 with a `Sunset` header and a dated removal plan. No silent behavior changes.
- Never version individual fields or negotiate versions via optional headers — one axis of versioning only.

## Idempotency & semantics
- Every non-GET mutation a client may retry (payments, order creation, webhooks) requires an `Idempotency-Key` header; same key + same body replays the stored result, same key + different body returns 409.
- PUT is full replace, PATCH is partial. In PATCH, absent field = unchanged, `null` = clear. Document it once, follow it everywhere (omission-preserves-stale-state bugs live here).
- GET/HEAD never mutate. No "GET with side effects" even for convenience.

## Conventions
- Timestamps: UTC, ISO-8601 with offset (`2026-07-05T10:00:00Z`). Epoch integers only in high-volume telemetry.
- IDs in responses are strings, even when numeric today — retyping later is a breaking change.
- Field naming picks one case (snake_case JSON) and never mixes.

## When NOT to apply
Internal one-consumer endpoints you can change atomically with the caller can skip versioning ceremony and idempotency keys — say so in the handler comment. The error envelope and 404/403 rules still apply.
