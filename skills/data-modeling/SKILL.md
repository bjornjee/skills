---
name: data-modeling
description: Use when designing schemas, adding indexes, writing migrations, or scoping multi-tenant data — constraint-first modeling and expand/contract migration rules.
---
# Data Modeling & Migrations

The schema outlives every service that reads it. Rules for making data changes boring.

## Constraints
- Declare at creation time: `NOT NULL`, foreign keys, `UNIQUE`, `CHECK`. Adding a constraint later is a locking migration + backfill; removing one is instant. Asymmetry says: start strict.
- Application-level validation duplicates, never replaces, database constraints — the DB is the last line against every code path you forgot.
- Enums: a reference table or DB enum with explicit values. "Magic string column validated in code" drifts within a quarter.
- Money is integer minor units or `NUMERIC`. Floats for money is a BLOCK.

## Keys & types
- Surrogate PKs; natural keys get `UNIQUE` constraints instead (they change; PKs must not).
- UUIDv7 (time-ordered) when inserts are hot or ordering matters — random UUIDv4 PKs fragment B-tree indexes.
- Timestamps: `timestamptz`, always UTC. `created_at`/`updated_at` on every table; `updated_at` maintained by trigger or ORM hook, not discipline.

## Indexes
- Index from query shapes, not intuition: write the query, run `EXPLAIN (ANALYZE, BUFFERS)`, add the index, prove the plan changed.
- Composite index column order = equality columns first, then range. Leading-column constraints often improve B-tree efficiency, but later-column predicates can still use the index (including PostgreSQL skip scans). Verify the actual version, cardinality, and query plan.
- Soft-delete × UNIQUE: `UNIQUE(email)` blocks re-registration after delete — use a partial index `WHERE NOT is_deleted`.
- Every index taxes every write. Zero scans (`pg_stat_user_indexes`) is a review candidate, not deletion authority. Confirm statistics-reset time and a representative business cycle, usage on replicas, constraint/rare-job roles, and a recreation/rollback plan before proposing removal.

## Migrations (expand → migrate → contract)
1. **Expand**: additive change (new nullable column/table/index `CONCURRENTLY`). Old and new code both work.
2. **Migrate**: deploy code writing both / reading new-with-fallback; backfill in batches (bounded, resumable, off-peak).
3. **Contract**: remove old column/path — ships **alone**, after verification, one deploy behind.
- Destructive steps (DROP, type narrowing, NOT NULL on existing data) never share a deploy with the code that stops needing them. Rollback of a combined deploy is impossible.
- Every migration states its lock behavior. `ALTER TABLE` that takes ACCESS EXCLUSIVE on a hot table is an outage, not a migration.
- Down-migrations that can't restore data (dropped column) are documented as irreversible — say so, don't fake it.

## Multi-tenancy
- Tenancy scoping lives in exactly **one** layer: RLS, a session variable, or the repository base query — never per-query `WHERE tenant_id=?` discipline. One forgotten WHERE is a data breach.
- Cross-tenant queries (admin/analytics) go through a named, audited path — not by omitting the filter.

## When NOT to apply
Prototypes and single-user tools: skip the ceremony, keep the constraints (they're free at creation). Analytics/warehouse schemas follow their own denormalization rules — this file governs OLTP.
