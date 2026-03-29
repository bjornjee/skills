package main

import (
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

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

func TestCloseResult_TriggersPruneDead(t *testing.T) {
	m := newModel("/tmp/test-state.json", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.agents = []Agent{
		{Target: "main:2.0", Window: 2, Pane: 0, State: "running"},
		{Target: "main:2.1", Window: 2, Pane: 1, State: "running"},
	}
	m.buildTree()

	// Simulate a successful close result
	result, cmd := m.Update(closeResultMsg{err: nil})
	_ = result

	if cmd == nil {
		t.Fatal("expected commands after closeResultMsg, got nil")
	}

	// Execute the batch to get individual commands
	// The batch should produce both loadState and pruneDead messages
	msgs := executeBatch(t, cmd)

	hasStateUpdate := false
	hasPruneDead := false
	for _, msg := range msgs {
		switch msg.(type) {
		case stateUpdatedMsg:
			hasStateUpdate = true
		case pruneDeadMsg:
			hasPruneDead = true
		}
	}

	if !hasStateUpdate {
		t.Error("closeResultMsg should trigger loadState (stateUpdatedMsg)")
	}
	if !hasPruneDead {
		t.Error("closeResultMsg should trigger pruneDead (pruneDeadMsg)")
	}
}

func TestReplyMode_ShowsInputBar(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.agents = []Agent{
		{Target: "main:2.0", Window: 2, Pane: 0, State: "input", Cwd: "/tmp"},
	}
	m.buildTree()
	m.tmuxAvailable = true
	m.conversation = []ConversationEntry{
		{Role: "assistant", Content: "What should I do?", Timestamp: "2026-03-29T10:00:00Z"},
	}
	m.updateRightContent()

	// Enter reply mode
	result, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'r'}})
	m = result.(model)

	if m.mode != modeReply {
		t.Fatalf("expected modeReply, got %d", m.mode)
	}

	// The message viewport should contain "Reply:" after entering reply mode
	content := m.messageVP.View()
	if !strings.Contains(content, "Reply:") {
		t.Error("message viewport should show 'Reply:' input bar after entering reply mode")
	}
}

func TestReplyMode_KeystrokesUpdateViewport(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.agents = []Agent{
		{Target: "main:2.0", Window: 2, Pane: 0, State: "input", Cwd: "/tmp"},
	}
	m.buildTree()
	m.tmuxAvailable = true
	m.conversation = []ConversationEntry{
		{Role: "assistant", Content: "What should I do?", Timestamp: "2026-03-29T10:00:00Z"},
	}
	m.updateRightContent()

	// Enter reply mode
	result, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'r'}})
	m = result.(model)

	// Type "hello"
	for _, ch := range "hello" {
		result, _ = m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{ch}})
		m = result.(model)
	}

	// The viewport should contain the typed text
	content := m.messageVP.View()
	if !strings.Contains(content, "hello") {
		t.Error("message viewport should show typed text 'hello' during reply mode")
	}
}

func TestReplyMode_EscRestoresView(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.agents = []Agent{
		{Target: "main:2.0", Window: 2, Pane: 0, State: "input", Cwd: "/tmp"},
	}
	m.buildTree()
	m.tmuxAvailable = true
	m.conversation = []ConversationEntry{
		{Role: "assistant", Content: "What should I do?", Timestamp: "2026-03-29T10:00:00Z"},
	}
	m.updateRightContent()

	// Enter reply mode
	result, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'r'}})
	m = result.(model)

	// Press esc
	result, _ = m.Update(tea.KeyMsg{Type: tea.KeyEsc})
	m = result.(model)

	if m.mode != modeNormal {
		t.Fatalf("expected modeNormal after esc, got %d", m.mode)
	}

	// Viewport should show the normal prompt hint, not the reply input
	content := m.messageVP.View()
	if strings.Contains(content, "Reply:") {
		t.Error("message viewport should not show 'Reply:' after esc")
	}
}

// executeBatch runs a tea.Cmd (expected to be a Batch) and collects messages.
func executeBatch(t *testing.T, cmd tea.Cmd) []tea.Msg {
	t.Helper()
	if cmd == nil {
		return nil
	}
	msg := cmd()
	// tea.Batch returns a tea.BatchMsg ([]tea.Cmd)
	if batch, ok := msg.(tea.BatchMsg); ok {
		var msgs []tea.Msg
		for _, c := range batch {
			if c != nil {
				msgs = append(msgs, c())
			}
		}
		return msgs
	}
	return []tea.Msg{msg}
}
