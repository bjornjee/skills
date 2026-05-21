.PHONY: help sync-codex-plugin sync-rules test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

sync-rules: ## Copy .claude/rules/core.md to ~/.claude/rules/core.md
	@cp .claude/rules/core.md $$HOME/.claude/rules/core.md
	@echo "✓ synced $$HOME/.claude/rules/core.md from .claude/rules/core.md"

sync-codex-plugin: ## Sync top-level skills into the Codex plugin package
	./scripts/sync-codex-plugin.sh

test: ## Run repository tests
	node --test scripts/*.test.js

.DEFAULT_GOAL := help
