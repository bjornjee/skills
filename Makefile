.PHONY: help sync-rules

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

sync-rules: ## Copy .claude/rules/core.md to ~/.claude/rules/core.md
	@cp .claude/rules/core.md $$HOME/.claude/rules/core.md
	@echo "✓ synced $$HOME/.claude/rules/core.md from .claude/rules/core.md"

.DEFAULT_GOAL := help
