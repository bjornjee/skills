.PHONY: help sync-codex-plugin sync-codex-rules sync-rules test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

sync-rules: ## Symlink every .claude/rules/*.md into ~/.claude/rules/ (edits then propagate automatically)
	@./scripts/install-rules-symlinks.sh

sync-codex-rules: ## Copy .codex/AGENTS.md to ~/.codex/AGENTS.md
	@cp .codex/AGENTS.md $$HOME/.codex/AGENTS.md
	@echo "✓ synced $$HOME/.codex/AGENTS.md from .codex/AGENTS.md"

sync-codex-plugin: ## Verify (and repair) the plugins/skills/skills symlink
	./scripts/sync-codex-plugin.sh

test: ## Run repository tests
	node --test scripts/*.test.js

.DEFAULT_GOAL := help
