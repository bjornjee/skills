package main

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

func newTestModelWithAgents() model {
	m := newModel("", "", nil)
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
		{Target: "main:2.0", Window: 2, Pane: 0, State: "running"},
	}
	m.agentSubagents["main:1.0"] = []SubagentInfo{
		{AgentID: "aaa", AgentType: "Explore", Description: "sub1"},
	}
	m.buildTree()
	// Tree: [parent0(0), sub-aaa(1), parent1(2)]
	return m
}

func TestShiftDownJumpsToNextParent(t *testing.T) {
	m := newTestModelWithAgents()
	m.selected = 0

	msg := tea.KeyMsg{Type: tea.KeyShiftDown}
	result, _ := m.handleKey(msg)
	rm := result.(model)

	if rm.selected != 2 {
		t.Errorf("shift+down from parent0: expected selected=2, got %d", rm.selected)
	}
}

func TestShiftUpJumpsToPrevParent(t *testing.T) {
	m := newTestModelWithAgents()
	m.selected = 2

	msg := tea.KeyMsg{Type: tea.KeyShiftUp}
	result, _ := m.handleKey(msg)
	rm := result.(model)

	if rm.selected != 0 {
		t.Errorf("shift+up from parent1: expected selected=0, got %d", rm.selected)
	}
}

func TestCtrlDownDoesNotJump(t *testing.T) {
	m := newTestModelWithAgents()
	// Start at parent0 (idx 0) — old code would jump to parent1 (idx 2)
	m.selected = 0

	msg := tea.KeyMsg{Type: tea.KeyCtrlDown}
	result, _ := m.handleKey(msg)
	rm := result.(model)

	// ctrl+down should NOT jump (feature removed), selection stays at 0
	if rm.selected != 0 {
		t.Errorf("ctrl+down should not change selection, expected 0, got %d", rm.selected)
	}
}

func TestCtrlUpDoesNotJump(t *testing.T) {
	m := newTestModelWithAgents()
	// Start at parent1 (idx 2) — if ctrl+up still worked, it would jump to 0
	m.selected = 2

	msg := tea.KeyMsg{Type: tea.KeyCtrlUp}
	result, _ := m.handleKey(msg)
	rm := result.(model)

	// ctrl+up should NOT jump (feature removed), selection stays at 2
	if rm.selected != 2 {
		t.Errorf("ctrl+up should not change selection, expected 2, got %d", rm.selected)
	}
}

func TestShiftSDoesNothing(t *testing.T) {
	m := newTestModelWithAgents()
	m.selected = 0

	msg := tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'S'}}
	result, _ := m.handleKey(msg)
	rm := result.(model)

	// "S" should not set any status message (feature removed)
	if rm.statusMsg != "" {
		t.Errorf("S key should not set statusMsg, got %q", rm.statusMsg)
	}
}
