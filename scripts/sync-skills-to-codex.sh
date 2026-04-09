#!/usr/bin/env bash
# sync-skills-to-codex.sh
#
# Copies selected Claude Code skills to Codex-compatible .agents/skills/ format.
# Strips the 'origin' frontmatter field which Codex doesn't recognize.
# Preserves agents/openai.yaml if it exists in the destination (Codex-specific config).
#
# Usage: ./scripts/sync-skills-to-codex.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/skills"
DST_DIR="$REPO_ROOT/.agents/skills"

# Skills to port to Codex (add/remove as needed)
SKILLS=(
    golang-patterns
    golang-testing
    git-workflow
    terminal-ops
    python-patterns
    fastapi-patterns
    react-native-patterns
    ai-ml-patterns
)

for skill in "${SKILLS[@]}"; do
    src="$SRC_DIR/$skill/SKILL.md"
    dst_dir="$DST_DIR/$skill"
    dst="$dst_dir/SKILL.md"

    if [ ! -f "$src" ]; then
        echo "SKIP: $src not found"
        continue
    fi

    mkdir -p "$dst_dir"

    # Copy and strip the 'origin' frontmatter field
    sed '/^origin:.*$/d' "$src" > "$dst"

    echo "SYNC: $skill/SKILL.md"

    # Note: agents/openai.yaml is Codex-specific and NOT synced from Claude skills.
    # Edit it directly in .agents/skills/<name>/agents/openai.yaml.
done

echo "Done. Synced ${#SKILLS[@]} skills to $DST_DIR"
echo "Note: agents/openai.yaml files are Codex-specific and must be edited directly."
