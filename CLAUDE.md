# Versioning

## Two Version Files — Keep in Sync

- `.claude-plugin/plugin.json` → `version` field
- `.claude-plugin/marketplace.json` → `plugins[0].version` field

These MUST always match. When bumping, update both files in the same commit.

## When to Bump

Bump the version on every commit that changes plugin behavior:
- Skills (`skills/`)
- Agents (`agents/`)
- Hooks (`hooks/`, `scripts/hooks/`)
- Rules (`.claude/rules/`)
- Shared packages (`packages/`)

Do NOT bump for changes that don't affect the plugin:
- README, docs, comments
- CI/CD config
- Test-only changes (unless they ship with the plugin)

## Semver

- **Patch** (0.0.x): Bug fixes, minor rule tweaks
- **Minor** (0.x.0): New skills, agents, hooks, or rules
- **Major** (x.0.0): Breaking changes (renamed skills, removed hooks, changed hook behavior)
