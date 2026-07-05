---
name: security-design
description: Use when designing anything with a trust boundary — auth systems, secrets handling, service-to-service calls, user input surfaces. Design-time security; review-time checks live in the core doctrine.
---
# Security Design

Design-time rules. (Review-time checks — injection, XSS, SSRF, path traversal — already run in the core doctrine's Phase 4 pass; don't duplicate them here.)

## Threat model at the boundary
- New trust boundary (new input surface, new caller, new stored credential, new network hop) ⇒ a written 10-minute STRIDE pass in the plan: what can be Spoofed, Tampered, Repudiated, Info-leaked, DoS'd, Elevated. Skipping this is skipping the design.
- Name the assets (what's worth stealing), the actors (who touches the boundary), and the blast radius of each credential before writing the auth code.

## Secrets
- Injected at runtime: env vars from a secret manager / KMS, mounted files. Never in code, config files, images, or logs — grep the diff for high-entropy strings and known prefixes (`sk-`, `ghp_`, `AKIA`) in review.
- One secret, one purpose, one owner. Shared "the API key" across services means rotation breaks everything at once.
- Rotation is designed in, not bolted on: two valid credentials during the window (old + new), then revoke.
- `.env` files are for local dev only and are gitignored; the presence of a real production secret in one is an incident, not a convention.

## Authentication
- Service-to-service: mTLS or short-lived signed tokens (OIDC/workload identity). Static shared API keys between services are a migration debt the day they ship.
- Token lifetimes: access tokens ≤ 1 hour; refresh tokens rotate on every use and are revocable server-side. A non-expiring token is a credential leak with a delay.
- Passwords: argon2id/bcrypt via a maintained library, never hand-rolled comparison (timing) or hashing.
- Webhooks verify signatures (HMAC with timestamp, reject old timestamps) — a webhook endpoint without verification is an open command channel.

## Authorization
- Deny by default. The absence of a rule is a rejection, not an allow.
- Authz decisions live in **one** place (middleware/policy layer/service method) — scattered `if user.role ==` checks guarantee one path forgets.
- Check at the resource, not just the route: `GET /orders/{id}` verifies the order belongs to the caller (IDOR is the most common real-world authz bug).
- Log authz denials with actor + resource + rule — silent denials hide both attacks and misconfigurations.

## Data
- Validate input at the boundary (schema, types, ranges); encode output at the sink (HTML-escape at render, parameterize at SQL). Middle layers pass data through untouched.
- PII gets an inventory: which tables, which logs, which backups. You cannot honor deletion requests for data you can't locate.
- Encrypt in transit everywhere (TLS internal too); at rest for anything you'd disclose in a breach notification.

## When NOT to apply
Local dev tools and single-user scripts with no network surface: skip mTLS/rotation ceremony. The secrets rules apply everywhere — "it's just a script" is how keys reach GitHub.
