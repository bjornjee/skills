package main

import "testing"

func TestBuildTree_DismissedSubagentsHidden(t *testing.T) {
	m := newModel("", "", nil)
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.agentSubagents["main:1.0"] = []SubagentInfo{
		{AgentID: "aaa", AgentType: "Explore", Description: "first"},
		{AgentID: "bbb", AgentType: "Bash", Description: "second"},
		{AgentID: "ccc", AgentType: "Plan", Description: "third"},
	}

	// No dismissals — all 4 nodes (1 parent + 3 subs)
	m.buildTree()
	if len(m.treeNodes) != 4 {
		t.Fatalf("expected 4 tree nodes, got %d", len(m.treeNodes))
	}

	// Dismiss "bbb"
	m.dismissed["main:1.0:bbb"] = true
	m.buildTree()
	if len(m.treeNodes) != 3 {
		t.Fatalf("expected 3 tree nodes after dismiss, got %d", len(m.treeNodes))
	}

	// Verify dismissed node is not present
	for _, node := range m.treeNodes {
		if node.Sub != nil && node.Sub.AgentID == "bbb" {
			t.Error("dismissed subagent 'bbb' should not appear in tree")
		}
	}
}

func TestBuildTree_CollapsedHidesSubs(t *testing.T) {
	m := newModel("", "", nil)
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.agentSubagents["main:1.0"] = []SubagentInfo{
		{AgentID: "aaa", AgentType: "Explore", Description: "first"},
	}

	m.collapsed["main:1.0"] = true
	m.buildTree()
	if len(m.treeNodes) != 1 {
		t.Fatalf("expected 1 tree node when collapsed, got %d", len(m.treeNodes))
	}
}

func TestEffectiveState_RunningPendingStop(t *testing.T) {
	m := newModel("", "", nil)
	m.pendingInput["a:0.1"] = true
	agent := Agent{Target: "a:0.1", State: "running", LastHookEvent: "Stop"}
	if got := m.effectiveState(agent); got != "input" {
		t.Errorf("expected input, got %s", got)
	}
}

func TestEffectiveState_RunningPendingPreToolUse(t *testing.T) {
	m := newModel("", "", nil)
	m.pendingInput["a:0.1"] = true
	agent := Agent{Target: "a:0.1", State: "running", LastHookEvent: "PreToolUse"}
	if got := m.effectiveState(agent); got != "input" {
		t.Errorf("expected input, got %s", got)
	}
}

func TestEffectiveState_RunningPendingPostToolUse(t *testing.T) {
	m := newModel("", "", nil)
	m.pendingInput["a:0.1"] = true
	// PostToolUse means tool just completed — should stay running
	agent := Agent{Target: "a:0.1", State: "running", LastHookEvent: "PostToolUse"}
	if got := m.effectiveState(agent); got != "running" {
		t.Errorf("expected running, got %s", got)
	}
}

func TestEffectiveState_RunningNoPending(t *testing.T) {
	m := newModel("", "", nil)
	agent := Agent{Target: "a:0.1", State: "running", LastHookEvent: "Stop"}
	if got := m.effectiveState(agent); got != "running" {
		t.Errorf("expected running, got %s", got)
	}
}

func TestEffectiveState_DoneWithPending(t *testing.T) {
	m := newModel("", "", nil)
	m.pendingInput["a:0.1"] = true
	// Done agent with pending input = plan approval race condition
	agent := Agent{Target: "a:0.1", State: "done", LastHookEvent: "Stop"}
	if got := m.effectiveState(agent); got != "input" {
		t.Errorf("expected input, got %s", got)
	}
}

func TestEffectiveState_DoneNoPending(t *testing.T) {
	m := newModel("", "", nil)
	agent := Agent{Target: "a:0.1", State: "done", LastHookEvent: "Stop"}
	if got := m.effectiveState(agent); got != "done" {
		t.Errorf("expected done, got %s", got)
	}
}

func TestNextParentAgent(t *testing.T) {
	m := newModel("", "", nil)
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
		{Target: "main:2.0", Window: 2, Pane: 0, State: "running"},
	}
	m.agentSubagents["main:1.0"] = []SubagentInfo{
		{AgentID: "aaa", AgentType: "Explore", Description: "sub1"},
		{AgentID: "bbb", AgentType: "Bash", Description: "sub2"},
	}
	m.buildTree()
	// Tree: [parent0, sub-aaa, sub-bbb, parent1]

	// From parent0 (idx 0), next parent should be parent1 (idx 3)
	m.selected = 0
	next := m.nextParentIndex(1)
	if next != 3 {
		t.Errorf("from parent0, expected next parent at index 3, got %d", next)
	}

	// From sub-aaa (idx 1), next parent should be parent1 (idx 3)
	m.selected = 1
	next = m.nextParentIndex(1)
	if next != 3 {
		t.Errorf("from sub-aaa, expected next parent at index 3, got %d", next)
	}

	// From parent1 (idx 3), next parent going down should stay at 3 (no more parents)
	m.selected = 3
	next = m.nextParentIndex(1)
	if next != 3 {
		t.Errorf("from last parent, expected to stay at 3, got %d", next)
	}

	// From parent1 (idx 3), prev parent should be parent0 (idx 0)
	m.selected = 3
	next = m.nextParentIndex(-1)
	if next != 0 {
		t.Errorf("from parent1, expected prev parent at index 0, got %d", next)
	}
}
