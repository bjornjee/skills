package main

import (
	"fmt"
	"path/filepath"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/fsnotify/fsnotify"
)

// -- Commands --

func (m model) captureSelected() tea.Cmd {
	agent := m.selectedAgent()
	if !m.tmuxAvailable || agent == nil {
		return nil
	}
	target := agent.Target
	return func() tea.Msg {
		lines, err := TmuxCapture(target, 15)
		if err != nil {
			return captureResultMsg{lines: nil}
		}
		return captureResultMsg{lines: lines}
	}
}

func (m model) loadConversation() tea.Cmd {
	agent := m.selectedAgent()
	if agent == nil || m.selectedSubagent() != nil {
		return nil // don't load conversation for subagent nodes
	}
	if agent.Cwd == "" {
		return nil
	}
	slug := ProjectSlug(agent.Cwd)
	projDir := filepath.Join(ConversationsDir(), slug)
	sessionID := agent.SessionID
	cwd := agent.Cwd

	return func() tea.Msg {
		if sessionID == "" {
			sessionID = FindSessionID(cwd)
		}
		if sessionID == "" {
			return conversationMsg{entries: nil}
		}
		entries := ReadConversation(projDir, sessionID, 50)
		return conversationMsg{entries: entries}
	}
}

// loadSelectionData loads the right data for the current tree selection.
func (m model) loadSelectionData() tea.Cmd {
	if m.selectedSubagent() != nil {
		return m.loadSubagentActivity()
	}
	return tea.Batch(m.captureSelected(), m.loadConversation())
}

// loadSubagentActivity loads activity log for the selected subagent.
func (m model) loadSubagentActivity() tea.Cmd {
	agent := m.selectedAgent()
	sub := m.selectedSubagent()
	if agent == nil || sub == nil || agent.Cwd == "" {
		return nil
	}
	slug := ProjectSlug(agent.Cwd)
	projDir := filepath.Join(ConversationsDir(), slug)
	sessionID := agent.SessionID
	cwd := agent.Cwd
	agentID := sub.AgentID

	return func() tea.Msg {
		if sessionID == "" {
			sessionID = FindSessionID(cwd)
		}
		if sessionID == "" {
			return activityMsg{entries: nil}
		}
		jsonlPath := SubagentJSONLPath(projDir, sessionID, agentID)
		entries := ReadActivityLog(jsonlPath, 500)
		return activityMsg{entries: entries}
	}
}

// loadAllSubagents loads subagent info for all agents.
func (m model) loadAllSubagents() []tea.Cmd {
	var cmds []tea.Cmd
	for _, agent := range m.agents {
		if agent.Cwd == "" {
			continue
		}
		a := agent // copy for closure
		cmds = append(cmds, func() tea.Msg {
			sid := a.SessionID
			if sid == "" {
				sid = FindSessionID(a.Cwd)
			}
			if sid == "" {
				return subagentsMsg{parentTarget: a.Target, agents: nil}
			}
			slug := ProjectSlug(a.Cwd)
			projDir := filepath.Join(ConversationsDir(), slug)
			subs := FindSubagents(projDir, sid)
			return subagentsMsg{parentTarget: a.Target, agents: subs}
		})
	}
	return cmds
}

func pruneDead(statePath string) tea.Cmd {
	return func() tea.Msg {
		livePanes := TmuxListPanes()
		if livePanes == nil {
			return pruneDeadMsg{removed: 0}
		}
		removed := PruneDead(statePath, livePanes)
		return pruneDeadMsg{removed: removed}
	}
}

func persistUsage(db *DB, agents []Agent, perAgent map[string]Usage) tea.Cmd {
	today := time.Now().Format("2006-01-02")
	type entry struct {
		sessionID string
		model     string
		usage     Usage
	}
	var entries []entry
	for _, agent := range agents {
		u, ok := perAgent[agent.Target]
		if !ok || u.OutputTokens == 0 {
			continue
		}
		sid := agent.SessionID
		if sid == "" {
			continue
		}
		entries = append(entries, entry{sessionID: sid, model: u.Model, usage: u})
	}

	return func() tea.Msg {
		for _, e := range entries {
			_ = db.UpsertUsage(today, e.sessionID, e.model, e.usage)
		}
		return persistResultMsg{}
	}
}

func loadDBCost(db *DB) tea.Cmd {
	return func() tea.Msg {
		return dbCostMsg{total: db.TotalCost()}
	}
}

func loadUsage(agents []Agent) tea.Cmd {
	agentsCopy := make([]Agent, len(agents))
	copy(agentsCopy, agents)
	return func() tea.Msg {
		perAgent, total := ReadAllUsage(agentsCopy)
		return usageMsg{perAgent: perAgent, total: total}
	}
}

func loadState(path string) tea.Cmd {
	return func() tea.Msg {
		return stateUpdatedMsg{state: ReadState(path)}
	}
}

func tickEvery() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func jumpToAgent(target string) tea.Cmd {
	return func() tea.Msg {
		return jumpResultMsg{err: TmuxJump(target)}
	}
}

func sendReply(target, text string) tea.Cmd {
	return func() tea.Msg {
		return sendResultMsg{err: TmuxSendKeys(target, text)}
	}
}

func sendRawKey(target, key string) tea.Cmd {
	return func() tea.Msg {
		return sendResultMsg{err: TmuxSendRaw(target, key)}
	}
}

func watchStateFile(path string, p *tea.Program) (*fsnotify.Watcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) {
					p.Send(stateUpdatedMsg{state: ReadState(path)})
				}
			case _, ok := <-watcher.Errors:
				if !ok {
					return
				}
			}
		}
	}()

	if err := watcher.Add(path); err != nil {
		dir := filepath.Dir(path)
		if dirErr := watcher.Add(dir); dirErr != nil {
			watcher.Close()
			return nil, fmt.Errorf("cannot watch %s: %w", path, err)
		}
	}

	return watcher, nil
}

// checkPendingInput checks if agents have pending tool_use in their JSONL.
func (m model) checkPendingInput() tea.Cmd {
	type agentCheck struct {
		target    string
		projDir   string
		sessionID string
		cwd       string
	}
	var checks []agentCheck
	for _, agent := range m.agents {
		if agent.State != "running" || agent.Cwd == "" {
			continue
		}
		sid := agent.SessionID
		if sid == "" {
			sid = FindSessionID(agent.Cwd)
		}
		if sid == "" {
			continue
		}
		slug := ProjectSlug(agent.Cwd)
		checks = append(checks, agentCheck{
			target:    agent.Target,
			projDir:   filepath.Join(ConversationsDir(), slug),
			sessionID: sid,
			cwd:       agent.Cwd,
		})
	}
	if len(checks) == 0 {
		return nil
	}

	// Return a batch of individual check commands
	var cmds []tea.Cmd
	for _, c := range checks {
		c := c
		cmds = append(cmds, func() tea.Msg {
			pending := HasPendingToolUse(c.projDir, c.sessionID)
			return pendingInputMsg{target: c.target, pending: pending}
		})
	}
	return tea.Batch(cmds...)
}
