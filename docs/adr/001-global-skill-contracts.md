# ADR 001: Self-contained Codex package
Status: proposed with the packaging PR split from #84.
Context: the previous package linked outside its root and could omit skills when copied.
Decision: the repository root is the Codex package root; canonical skills are packaged directly.
Ownership: package installation exposes skills; personal global installation remains explicit.
Validation: copy the manifest and skills into an isolated directory and reject escaping symlinks.
Versioning: keep all three manifests aligned and verify increases against the PR base.
Consumers: refresh the marketplace package after this root-path migration.
Rollout: review and merge first; this PR performs no global installation or cache changes.
Rollback: revert the package-path change and refresh the package; preserve installed user content.
