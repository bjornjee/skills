.PHONY: install test build-dashboard install-dashboard dashboard seed clean

install: ## Install dependencies
	npm install

test: ## Run all tests
	node --test packages/*/test.js scripts/hooks/*.test.js
	go test ./cmd/dashboard/...

test-fast: ## Run fast tests only (Node unit tests, no Go build)
	node --test packages/*/test.js scripts/hooks/*.test.js

build-dashboard: ## Build the Go dashboard binary
	go build -o bin/agent-dashboard ./cmd/dashboard/

install-dashboard: build-dashboard ## Install dashboard to ~/.local/bin
	cp bin/agent-dashboard ~/.local/bin/agent-dashboard

dashboard: build-dashboard ## Launch the agent dashboard
	./bin/agent-dashboard

seed: ## Seed fake agent state for testing
	@node -e " \
		const { writeState } = require('./packages/agent-state'); \
		const now = Date.now(); \
		writeState('skills:0.0', { target:'skills:0.0', session:'skills', window:0, pane:0, state:'done', cwd:process.cwd(), branch:'main', files_changed:['+packages/tmux/index.js','~hooks/hooks.json'], last_message_preview:'All tests pass. 72 tests, 0 failures.', started_at: new Date(now-120000).toISOString() }); \
		writeState('api:1.0', { target:'api:1.0', session:'api', window:1, pane:0, state:'input', cwd:'/Users/bjornjee/Code/api', branch:'feat/auth', files_changed:['+src/auth/provider.ts','~src/config.ts'], last_message_preview:'Which auth provider should I use? Firebase or Supabase?', started_at: new Date(now-180000).toISOString() }); \
		writeState('web:2.0', { target:'web:2.0', session:'web', window:2, pane:0, state:'running', cwd:'/Users/bjornjee/Code/web', branch:'fix/nav', files_changed:['~src/router.ts','~src/components/Nav.tsx'], last_message_preview:'Reading src/router.ts to understand the navigation structure...', started_at: new Date(now-60000).toISOString() }); \
		writeState('e2e:3.0', { target:'e2e:3.0', session:'e2e', window:3, pane:0, state:'error', cwd:'/Users/bjornjee/Code/e2e', branch:'main', files_changed:['-test/old.ts'], last_message_preview:'Build failed: Cannot find module react-router-dom', started_at: new Date(now-300000).toISOString() }); \
		console.log('Seeded 4 agents: done, input, running, error'); \
	"

clean: ## Remove seeded agent state
	rm -f ~/.claude/agent-dashboard/state.json

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
