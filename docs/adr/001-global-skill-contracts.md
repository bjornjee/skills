# ADR 001: Self-contained packages and explicit global ownership
Status: proposed with the global-skills audit remediation PR.
Context: escaping package symlinks and directory replacement can lose skills or user files.
Decision: the repository root is the Codex package root; canonical skills are packaged directly.
Decision: sync v2 records per-file hashes/modes and source provenance, preserving unowned extras.
Migration: accept v1 for inspection but never infer overwrite/deletion authority from directory names.
Failure: preflight, serialize with a private journal, atomically replace files, and roll back caught failures.
Consumers: marketplace users must refresh the package; UI verdict readers must adopt raw scores, null scores with score_exceptions, explicit tradeoffs, and parent-owned budget reporting.
Rollout: merge/review first; no global installation, cache changes, or personal-skill edits in this PR.
Rollback: revert the repository change for source; restore verified file/manifest backups for an explicit global rollout.
