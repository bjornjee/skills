# Versioning

## Three Version Files — Keep in Sync

- `.claude-plugin/plugin.json` → `version` field
- `.claude-plugin/marketplace.json` → `plugins[0].version` field
- `plugins/skills/.codex-plugin/plugin.json` → `version` field (Codex plugin)

These MUST always match. When bumping, update all three files in the same commit. `make test` enforces the lockstep (`scripts/codex-marketplace.test.js`).

## When to Bump

Bump the version on every commit that changes plugin behavior:
- Skills (`skills/`)
- Agents (`agents/`)
- Rules (`.claude/rules/`)

Do NOT bump for changes that don't affect the plugin:
- README, docs, comments
- CI/CD config

## Semver

- **Patch** (0.0.x): Bug fixes, minor rule tweaks
- **Minor** (0.x.0): New skills, agents, or rules
- **Major** (x.0.0): Breaking changes (renamed/removed skills, agents, or rules)
