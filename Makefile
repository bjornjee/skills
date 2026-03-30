.PHONY: install test help

install: ## Install dependencies
	npm install

test: ## Run all tests
	node --test packages/*/test.js scripts/hooks/*.test.js

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
