.PHONY: help bump sync-codex-native sync-codex-plugin sync-codex-rules sync-rules test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

bump: ## Set the plugin version in all three manifests atomically (usage: make bump V=1.1.0)
	@test -n "$(V)" || { echo "usage: make bump V=<x.y.z>" >&2; exit 2; }
	@echo "$(V)" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$$' || { echo "error: V must be semver x.y.z, got '$(V)'" >&2; exit 2; }
	@python3 -c 'import json,sys; v=sys.argv[1]; \
	paths=[".claude-plugin/plugin.json","plugins/skills/.codex-plugin/plugin.json"]; \
	[(lambda p: (lambda d: (d.__setitem__("version",v), open(p,"w").write(json.dumps(d,indent=2,ensure_ascii=False)+"\n")))(json.load(open(p))))(p) for p in paths]; \
	p=".claude-plugin/marketplace.json"; d=json.load(open(p)); \
	e=next(x for x in d["plugins"] if x["name"]=="skills"); e["version"]=v; \
	open(p,"w").write(json.dumps(d,indent=2,ensure_ascii=False)+"\n"); \
	print(f"✓ all three manifests -> {v}")' "$(V)"

sync-rules: ## Symlink every .claude/rules/*.md into ~/.claude/rules/ (edits then propagate automatically)
	@./scripts/install-rules-symlinks.sh

sync-codex-rules: ## Copy .codex/AGENTS.md to ~/.codex/AGENTS.md
	@cp .codex/AGENTS.md $$HOME/.codex/AGENTS.md
	@echo "✓ synced $$HOME/.codex/AGENTS.md from .codex/AGENTS.md"

sync-codex-native: ## Install skills, rules, guardrail hooks, and agents without plugins
	@node scripts/sync-codex-native.js $(ARGS)

sync-codex-plugin: ## Verify (and repair) the plugins/skills/skills symlink
	./scripts/sync-codex-plugin.sh

test: ## Run repository tests
	node --test scripts/*.test.js

.DEFAULT_GOAL := help
