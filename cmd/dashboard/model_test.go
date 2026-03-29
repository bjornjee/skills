package main

import (
	"fmt"
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

func TestFindWindowForRepo_MatchesByFolder(t *testing.T) {
	agents := []Agent{
		{Target: "main:1.0", Session: "main", Window: 1, Pane: 0, Cwd: "/home/user/code/skills"},
		{Target: "main:2.0", Session: "main", Window: 2, Pane: 0, Cwd: "/home/user/code/other"},
	}

	sw, found := findWindowForRepo(agents, "/home/user/code/skills", "main:0.0")
	if !found {
		t.Fatal("expected to find window for matching folder")
	}
	if sw != "main:1" {
		t.Errorf("expected session:window main:1, got %q", sw)
	}
}

func TestFindWindowForRepo_NoMatch(t *testing.T) {
	agents := []Agent{
		{Target: "main:1.0", Session: "main", Window: 1, Pane: 0, Cwd: "/home/user/code/skills"},
	}

	_, found := findWindowForRepo(agents, "/home/user/code/newrepo", "main:0.0")
	if found {
		t.Error("expected no match for different folder")
	}
}

func TestFindWindowForRepo_EmptyAgents(t *testing.T) {
	_, found := findWindowForRepo(nil, "/home/user/code/skills", "main:0.0")
	if found {
		t.Error("expected no match with empty agents")
	}
}

func TestCreateSessionMsg_Success(t *testing.T) {
	m := newModel("/tmp/test-state.json", "main:0.0", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	result, _ := m.Update(createSessionMsg{target: "main:2.0", err: nil})
	rm := result.(model)

	if rm.mode != modeInteractive {
		t.Errorf("expected modeInteractive after successful create, got %d", rm.mode)
	}
	if rm.interactTarget != "main:2.0" {
		t.Errorf("expected interactTarget main:2.0, got %q", rm.interactTarget)
	}
}

func TestCreateSessionMsg_Error(t *testing.T) {
	m := newModel("/tmp/test-state.json", "main:0.0", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true

	result, _ := m.Update(createSessionMsg{target: "", err: fmt.Errorf("4-pane limit reached")})
	rm := result.(model)

	if rm.mode != modeNormal {
		t.Errorf("expected modeNormal after failed create, got %d", rm.mode)
	}
	if !strings.Contains(rm.statusMsg, "4-pane limit") {
		t.Errorf("expected error in statusMsg, got %q", rm.statusMsg)
	}
}

func TestInteractiveMode_InputVisibleAtBottom(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	// Enter interactive mode
	result, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'i'}})
	m = result.(model)

	// Simulate many captured lines (more than viewport height) to push input below fold
	var lines []string
	for i := 0; i < 50; i++ {
		lines = append(lines, fmt.Sprintf("output line %d", i))
	}
	m.capturedLines = lines
	m.updateRightContent()

	// Type something
	for _, ch := range "test input" {
		result, _ = m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{ch}})
		m = result.(model)
	}

	// The visible viewport content should contain the typed text
	content := m.messageVP.View()
	if !strings.Contains(content, "test input") {
		t.Error("interactive mode viewport should show typed text — viewport must scroll to bottom")
	}
}

func TestInteractiveMode_SendShowsStatusMsg(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	// Enter interactive mode
	m.mode = modeInteractive
	m.interactTarget = "main:1.0"
	m.textInput.Focus()
	m.textInput.SetValue("hello world")

	// Press enter to send
	result, _ := m.handleKey(tea.KeyMsg{Type: tea.KeyEnter})
	rm := result.(model)

	if !strings.Contains(rm.statusMsg, "hello world") {
		t.Errorf("expected statusMsg to contain sent text, got %q", rm.statusMsg)
	}
}

func TestCreateFolderMode_SuggestionsShown(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	// Pre-load z entries
	m.zEntries = []zEntry{
		{Path: "/Users/bjornjee/Code/skills", Rank: 100, Timestamp: 1774000000},
		{Path: "/Users/bjornjee/Code/other", Rank: 50, Timestamp: 1773000000},
		{Path: "/tmp/unrelated", Rank: 10, Timestamp: 1770000000},
	}

	// Enter create folder mode
	result, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}})
	m = result.(model)

	// Type partial path
	for _, ch := range "skills" {
		result, _ = m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{ch}})
		m = result.(model)
	}

	// Should have suggestions filtered to match "skills"
	if len(m.suggestions) == 0 {
		t.Fatal("expected suggestions matching 'skills'")
	}
	if !strings.Contains(m.suggestions[0], "skills") {
		t.Errorf("expected first suggestion to contain 'skills', got %q", m.suggestions[0])
	}
}

func TestCreateFolderMode_TabAcceptsSuggestion(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	m.zEntries = []zEntry{
		{Path: "/Users/bjornjee/Code/skills", Rank: 100, Timestamp: 1774000000},
	}

	// Enter create folder mode and type partial
	m.mode = modeCreateFolder
	m.textInput.Focus()
	m.textInput.SetValue("ski")
	m.suggestions = filterZSuggestions("ski", m.zEntries)

	// Press tab to accept
	result, _ := m.handleKey(tea.KeyMsg{Type: tea.KeyTab})
	rm := result.(model)

	if rm.textInput.Value() != "/Users/bjornjee/Code/skills" {
		t.Errorf("expected tab to accept suggestion, got %q", rm.textInput.Value())
	}
	if len(rm.suggestions) != 0 {
		t.Error("expected suggestions to be cleared after tab accept")
	}
}

func TestCreateFolderMode_SuggestionsInView(t *testing.T) {
	m := newModel("", "", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.tmuxAvailable = true
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
	}
	m.buildTree()

	m.zEntries = []zEntry{
		{Path: "/Users/bjornjee/Code/skills", Rank: 100, Timestamp: 1774000000},
		{Path: "/Users/bjornjee/Code/other", Rank: 50, Timestamp: 1773000000},
	}

	// Enter create folder mode
	m.mode = modeCreateFolder
	m.textInput.Focus()
	m.textInput.SetValue("Code")
	m.suggestions = filterZSuggestions("Code", m.zEntries)
	m.updateRightContent()

	content := m.messageVP.View()
	if !strings.Contains(content, "skills") {
		t.Error("viewport should show suggestion paths matching query")
	}
}

func TestStateUpdate_PrunesAllMaps(t *testing.T) {
	m := newModel("/tmp/test-state.json", "main:0.0", nil)
	m.width = 120
	m.height = 40
	m.resizeViewports()
	m.agents = []Agent{
		{Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
		{Target: "main:2.0", Window: 2, Pane: 0, State: "done"},
	}
	m.buildTree()

	// Populate maps for both agents
	m.pendingInput["main:1.0"] = true
	m.pendingInput["main:2.0"] = false
	m.prevEffState["main:1.0"] = "running"
	m.prevEffState["main:2.0"] = "done"
	m.agentSubagents["main:1.0"] = []SubagentInfo{{AgentID: "sub1"}}
	m.agentSubagents["main:2.0"] = []SubagentInfo{{AgentID: "sub2"}}
	m.collapsed["main:1.0"] = true
	m.collapsed["main:2.0"] = false
	m.dismissed["main:1.0:sub1"] = true
	m.dismissed["main:2.0:sub2"] = true

	// Simulate state update where main:2.0 is removed
	sf := StateFile{
		Agents: map[string]Agent{
			"main:1.0": {Target: "main:1.0", Window: 1, Pane: 0, State: "running"},
		},
	}
	result, _ := m.Update(stateUpdatedMsg{state: sf})
	rm := result.(model)

	// main:1.0 maps should survive
	if _, ok := rm.pendingInput["main:1.0"]; !ok {
		t.Error("pendingInput for main:1.0 should survive")
	}
	if _, ok := rm.agentSubagents["main:1.0"]; !ok {
		t.Error("agentSubagents for main:1.0 should survive")
	}

	// main:2.0 maps should be pruned
	if _, ok := rm.pendingInput["main:2.0"]; ok {
		t.Error("pendingInput for main:2.0 should be pruned")
	}
	if _, ok := rm.prevEffState["main:2.0"]; ok {
		t.Error("prevEffState for main:2.0 should be pruned")
	}
	if _, ok := rm.agentSubagents["main:2.0"]; ok {
		t.Error("agentSubagents for main:2.0 should be pruned")
	}
	if _, ok := rm.collapsed["main:2.0"]; ok {
		t.Error("collapsed for main:2.0 should be pruned")
	}
	if _, ok := rm.dismissed["main:2.0:sub2"]; ok {
		t.Error("dismissed for main:2.0:sub2 should be pruned")
	}
	// dismissed for main:1.0 should survive
	if _, ok := rm.dismissed["main:1.0:sub1"]; !ok {
		t.Error("dismissed for main:1.0:sub1 should survive")
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
