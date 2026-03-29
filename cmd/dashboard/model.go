package main

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/fsnotify/fsnotify"
)

// -- Styles --

var (
	borderStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("240"))

	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("86"))

	selectedStyle = lipgloss.NewStyle().
			Bold(true).
			Background(lipgloss.Color("62")).
			Foreground(lipgloss.Color("230"))

	inputColor   = lipgloss.Color("220")
	errorColor   = lipgloss.Color("196")
	runningColor = lipgloss.Color("75")
	idleColor    = lipgloss.Color("242")
	doneColor    = lipgloss.Color("82")

	helpStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("242"))
	boldStyle = lipgloss.NewStyle().Bold(true)
	costStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("214")).Bold(true)
)

type stateIcon struct {
	icon  string
	color lipgloss.Color
}

var stateIcons = map[string]stateIcon{
	"input":   {"!", inputColor},
	"error":   {"✗", errorColor},
	"running": {"▶", runningColor},
	"idle":    {"○", idleColor},
	"done":    {"✓", doneColor},
}

// -- Messages --

type stateUpdatedMsg struct{ state StateFile }
type tickMsg time.Time
type jumpResultMsg struct{ err error }
type sendResultMsg struct{ err error }
type captureResultMsg struct{ lines []string }
type conversationMsg struct{ entries []ConversationEntry }
type pruneDeadMsg struct{ removed int }
type usageMsg struct {
	perAgent map[string]Usage
	total    Usage
}
type persistResultMsg struct{ err error }
type dbCostMsg struct{ total float64 }
type activityMsg struct{ entries []ActivityEntry }
type subagentsMsg struct {
	parentTarget string
	agents       []SubagentInfo
}
type pendingInputMsg struct {
	target  string
	pending bool
}
type rateLimitMsg struct {
	target string
	status RateLimitStatus
}

// -- Modes --

const (
	modeNormal = iota
	modeReply
	modeUsage
)

// -- Viewport focus --

const (
	focusAgentList = iota
	focusFiles
	focusHistory
	focusMessage
	focusCount // sentinel for wrapping
)

// Fixed heights for inner viewports
const (
	filesVPHeight   = 5
	historyVPHeight = 10
	headerLines     = 8 // header + state + branch + dir + cost + spacers
	sectionGaps     = 6 // gaps between sections (labels + blank-line buffers)
)

// -- Tree node --

// treeNode is a flat entry in the navigation tree (agent or subagent).
type treeNode struct {
	AgentIdx int           // index into m.agents
	Sub      *SubagentInfo // nil for parent agent nodes
}

// -- Model --

type model struct {
	agents        []Agent
	selected      int // index into treeNodes
	treeNodes     []treeNode
	width, height int
	mode          int
	textInput     textinput.Model
	tmuxAvailable bool
	statePath     string
	selfTarget    string
	statusMsg     string
	statusMsgTick int // tick when statusMsg was set; clears after 3s
	capturedLines []string
	conversation  []ConversationEntry
	tickCount     int
	agentUsage    map[string]Usage
	totalUsage    Usage
	db            *DB
	dbTotalCost   float64

	// Viewports
	agentListVP viewport.Model
	filesVP     viewport.Model
	historyVP   viewport.Model
	messageVP   viewport.Model
	focusedVP   int

	// Layout cache (for mouse routing)
	leftWidth  int
	rightWidth int

	// Subagent tree
	agentSubagents map[string][]SubagentInfo // parentTarget → subagents
	collapsed      map[string]bool           // parentTarget → collapsed state
	subActivity    []ActivityEntry           // activity log for selected subagent

	// Pending input detection (permission prompts)
	pendingInput map[string]bool // agentTarget → has pending tool_use

	// Rate limit status per agent
	rateLimits map[string]RateLimitStatus // agentTarget → last rate limit
}

// buildTree rebuilds the flat tree node list from agents and their subagents.
func (m *model) buildTree() {
	m.treeNodes = nil
	for i, agent := range m.agents {
		m.treeNodes = append(m.treeNodes, treeNode{AgentIdx: i})
		if !m.collapsed[agent.Target] {
			for _, sub := range m.agentSubagents[agent.Target] {
				s := sub // copy
				m.treeNodes = append(m.treeNodes, treeNode{AgentIdx: i, Sub: &s})
			}
		}
	}
}

// selectedAgent returns the parent agent for the current selection.
func (m model) selectedAgent() *Agent {
	if m.selected >= len(m.treeNodes) {
		return nil
	}
	idx := m.treeNodes[m.selected].AgentIdx
	if idx >= len(m.agents) {
		return nil
	}
	return &m.agents[idx]
}

// selectedSubagent returns the subagent for the current selection, or nil if parent is selected.
func (m model) selectedSubagent() *SubagentInfo {
	if m.selected >= len(m.treeNodes) {
		return nil
	}
	return m.treeNodes[m.selected].Sub
}

func newModel(statePath, selfTarget string, db *DB) model {
	ti := textinput.New()
	ti.Placeholder = "Type reply..."
	ti.CharLimit = 4096

	return model{
		agents:         nil,
		statePath:      statePath,
		selfTarget:     selfTarget,
		tmuxAvailable:  TmuxIsAvailable(),
		textInput:      ti,
		mode:           modeNormal,
		db:             db,
		agentListVP:    viewport.New(0, 0),
		filesVP:        viewport.New(0, 0),
		historyVP:      viewport.New(0, 0),
		messageVP:      viewport.New(0, 0),
		focusedVP:      focusAgentList,
		agentSubagents: make(map[string][]SubagentInfo),
		collapsed:      make(map[string]bool),
		pendingInput:   make(map[string]bool),
	}
}

func (m model) Init() tea.Cmd {
	cmds := []tea.Cmd{
		loadState(m.statePath),
		tickEvery(),
		m.captureSelected(),
		loadUsage(m.agents),
	}
	if m.db != nil {
		cmds = append(cmds, loadDBCost(m.db))
	}
	return tea.Batch(cmds...)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.resizeViewports()
		return m, nil

	case stateUpdatedMsg:
		m.agents = SortedAgents(msg.state, m.selfTarget)
		// Prune pendingInput for agents no longer present
		live := make(map[string]bool, len(m.agents))
		for _, a := range m.agents {
			live[a.Target] = true
		}
		for target := range m.pendingInput {
			if !live[target] {
				delete(m.pendingInput, target)
			}
		}
		m.buildTree()
		if m.selected >= len(m.treeNodes) {
			m.selected = max(0, len(m.treeNodes)-1)
		}
		m.updateLeftContent()
		m.updateRightContent()
		cmds := []tea.Cmd{m.captureSelected(), m.loadConversation(), loadUsage(m.agents)}
		cmds = append(cmds, m.loadAllSubagents()...)
		return m, tea.Batch(cmds...)

	case conversationMsg:
		prevLen := len(m.conversation)
		m.conversation = msg.entries
		m.updateRightContent()
		// On first load, scroll history to end
		if prevLen == 0 {
			m.historyVP.GotoBottom()
		}
		return m, nil

	case tickMsg:
		m.tickCount++
		// Auto-clear status message after 3 seconds
		if m.statusMsg != "" && m.tickCount-m.statusMsgTick >= 3 {
			m.statusMsg = ""
		}
		cmds := []tea.Cmd{tickEvery(), m.captureSelected(), m.loadConversation()}
		if m.selectedSubagent() != nil {
			cmds = append(cmds, m.loadSubagentActivity())
		}
		// Check for pending tool_use every 2 ticks (2s)
		if m.tickCount%2 == 0 {
			if cmd := m.checkPendingInput(); cmd != nil {
				cmds = append(cmds, cmd)
			}
		}
		if m.tickCount%5 == 0 {
			cmds = append(cmds, m.loadAllSubagents()...)
		}
		if m.tickCount%10 == 0 {
			cmds = append(cmds, pruneDead(m.statePath), loadUsage(m.agents))
		}
		return m, tea.Batch(cmds...)

	case usageMsg:
		m.agentUsage = msg.perAgent
		m.totalUsage = msg.total
		m.updateRightContent()
		var cmds []tea.Cmd
		if m.db != nil {
			cmds = append(cmds, persistUsage(m.db, m.agents, msg.perAgent))
			cmds = append(cmds, loadDBCost(m.db))
		}
		if len(cmds) > 0 {
			return m, tea.Batch(cmds...)
		}
		return m, nil

	case persistResultMsg:
		return m, nil

	case dbCostMsg:
		m.dbTotalCost = msg.total
		return m, nil

	case activityMsg:
		if m.selectedSubagent() != nil {
			m.subActivity = msg.entries
			m.updateRightContent()
		}
		return m, nil

	case pendingInputMsg:
		m.pendingInput[msg.target] = msg.pending
		m.updateLeftContent()
		m.updateRightContent()
		return m, nil

	case subagentsMsg:
		m.agentSubagents[msg.parentTarget] = msg.agents
		m.buildTree()
		if m.selected >= len(m.treeNodes) {
			m.selected = max(0, len(m.treeNodes)-1)
		}
		m.updateLeftContent()
		return m, nil

	case pruneDeadMsg:
		if msg.removed > 0 {
			return m, loadState(m.statePath)
		}
		return m, nil

	case captureResultMsg:
		m.capturedLines = msg.lines
		m.updateRightContent()
		return m, nil

	case jumpResultMsg:
		if msg.err != nil {
			m.statusMsg = fmt.Sprintf("Jump failed: %v", msg.err)
		} else {
			m.statusMsg = "Jumped — switch back to this window for dashboard"
		}
		m.statusMsgTick = m.tickCount
		return m, nil

	case sendResultMsg:
		if msg.err != nil {
			m.statusMsg = fmt.Sprintf("Reply failed: %v", msg.err)
		} else {
			m.statusMsg = "Reply sent"
		}
		m.statusMsgTick = m.tickCount
		return m, nil

	case tea.MouseMsg:
		return m.handleMouse(msg)

	case tea.KeyMsg:
		return m.handleKey(msg)
	}

	if m.mode == modeReply {
		var cmd tea.Cmd
		m.textInput, cmd = m.textInput.Update(msg)
		return m, cmd
	}

	return m, nil
}

func (m *model) resizeViewports() {
	m.leftWidth = m.width*30/100 - 2
	m.rightWidth = m.width - m.leftWidth - 4
	panelHeight := m.height - 5

	m.agentListVP.Width = m.leftWidth
	m.agentListVP.Height = panelHeight

	m.filesVP.Width = m.rightWidth
	m.filesVP.Height = filesVPHeight

	m.historyVP.Width = m.rightWidth
	m.historyVP.Height = historyVPHeight

	msgHeight := panelHeight - headerLines - filesVPHeight - historyVPHeight - sectionGaps
	if msgHeight < 3 {
		msgHeight = 3
	}
	m.messageVP.Width = m.rightWidth
	m.messageVP.Height = msgHeight

	m.updateLeftContent()
	m.updateRightContent()
}

func (m model) handleMouse(msg tea.MouseMsg) (tea.Model, tea.Cmd) {
	leftBorderEnd := m.leftWidth + 2

	if msg.X < leftBorderEnd {
		var cmd tea.Cmd
		m.agentListVP, cmd = m.agentListVP.Update(msg)
		return m, cmd
	}

	// Route to inner right viewport based on Y position
	// Header takes ~headerLines rows + 1 border
	rightStart := 1 // top border
	filesStart := rightStart + headerLines
	historyStart := filesStart + filesVPHeight + 2     // +1 label +1 buffer
	messageStart := historyStart + historyVPHeight + 2 // +1 label +1 buffer

	var cmd tea.Cmd
	if msg.Y >= messageStart {
		m.messageVP, cmd = m.messageVP.Update(msg)
	} else if msg.Y >= historyStart {
		m.historyVP, cmd = m.historyVP.Update(msg)
	} else if msg.Y >= filesStart {
		m.filesVP, cmd = m.filesVP.Update(msg)
	}
	return m, cmd
}

func (m model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	key := msg.String()

	// Reply mode
	if m.mode == modeReply {
		switch key {
		case "enter":
			text := m.textInput.Value()
			m.mode = modeNormal
			m.textInput.Reset()
			if text != "" {
				if agent := m.selectedAgent(); agent != nil {
					return m, sendReply(agent.Target, text)
				}
			}
			return m, nil
		case "esc":
			m.mode = modeNormal
			m.textInput.Reset()
			return m, nil
		default:
			var cmd tea.Cmd
			m.textInput, cmd = m.textInput.Update(msg)
			return m, cmd
		}
	}

	// Normal mode
	switch key {
	case "q", "ctrl+c":
		return m, tea.Quit
	case "up", "k":
		if m.selected > 0 {
			m.selected--
			m.statusMsg = ""
			m.mode = modeNormal
			m.conversation = nil
			m.subActivity = nil
			m.updateLeftContent()
			m.updateRightContent()
			return m, m.loadSelectionData()
		}
	case "down", "j":
		if m.selected < len(m.treeNodes)-1 {
			m.selected++
			m.statusMsg = ""
			m.mode = modeNormal
			m.conversation = nil
			m.subActivity = nil
			m.updateLeftContent()
			m.updateRightContent()
			return m, m.loadSelectionData()
		}
	case "c":
		// Toggle collapse on current agent's subagent tree
		if agent := m.selectedAgent(); agent != nil {
			m.collapsed[agent.Target] = !m.collapsed[agent.Target]
			m.buildTree()
			if m.selected >= len(m.treeNodes) {
				m.selected = max(0, len(m.treeNodes)-1)
			}
			m.updateLeftContent()
			return m, nil
		}
	case "tab":
		m.focusedVP = (m.focusedVP + 1) % focusCount
		return m, nil
	case "shift+tab":
		m.focusedVP = (m.focusedVP - 1 + focusCount) % focusCount
		return m, nil
	case "ctrl+u":
		return m.scrollFocused(msg)
	case "ctrl+d":
		return m.scrollFocused(msg)
	case "enter":
		if !m.tmuxAvailable {
			m.statusMsg = "Cannot jump: tmux not detected"
			return m, nil
		}
		if agent := m.selectedAgent(); agent != nil {
			return m, jumpToAgent(agent.Target)
		}
	case "r":
		if !m.tmuxAvailable {
			m.statusMsg = "Cannot reply: tmux not detected"
			return m, nil
		}
		if m.selectedAgent() != nil && m.selectedSubagent() == nil {
			m.mode = modeReply
			m.textInput.Focus()
			return m, textinput.Blink
		}
	case "u":
		if m.mode == modeUsage {
			m.mode = modeNormal
			m.updateRightContent()
		} else {
			m.mode = modeUsage
			m.updateRightContent()
		}
		return m, nil
	case "y", "n":
		if agent := m.selectedAgent(); m.tmuxAvailable && agent != nil && m.selectedSubagent() == nil {
			es := m.effectiveState(*agent)
			if es == "input" || es == "error" {
				return m, sendRawKey(agent.Target, key)
			}
		}
	case "1", "2", "3", "4", "5", "6", "7", "8", "9":
		if agent := m.selectedAgent(); m.tmuxAvailable && agent != nil && m.selectedSubagent() == nil {
			es := m.effectiveState(*agent)
			if es == "input" || es == "error" {
				return m, sendRawKey(agent.Target, key)
			}
		}
	}

	return m, nil
}

func (m model) scrollFocused(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	switch m.focusedVP {
	case focusAgentList:
		m.agentListVP, cmd = m.agentListVP.Update(msg)
	case focusFiles:
		m.filesVP, cmd = m.filesVP.Update(msg)
	case focusHistory:
		m.historyVP, cmd = m.historyVP.Update(msg)
	case focusMessage:
		m.messageVP, cmd = m.messageVP.Update(msg)
	}
	return m, cmd
}

// -- Content Builders --

func (m *model) updateLeftContent() {
	m.agentListVP.SetContent(m.agentListContent())
}

func (m *model) updateRightContent() {
	agent := m.selectedAgent()
	if agent == nil {
		m.filesVP.SetContent("")
		m.historyVP.SetContent("")
		m.messageVP.SetContent("  No agents found")
		return
	}

	// Usage mode overrides right panel content
	if m.mode == modeUsage {
		m.filesVP.SetContent("")
		m.historyVP.SetContent("")
		m.messageVP.SetContent(m.usageContent())
		return
	}

	sub := m.selectedSubagent()
	if sub != nil {
		// Subagent right panel: files touched + activity + output
		m.filesVP.SetContent(m.subagentFilesContent())
		m.historyVP.SetContent(m.subagentActivityContent())
		m.messageVP.SetContent(m.subagentOutputContent())
		return
	}

	// Parent agent right panel
	m.filesVP.SetContent(m.filesContent(*agent))
	m.historyVP.SetContent(m.historyContent())

	effState := m.effectiveState(*agent)
	needsAttention := effState == "input" || effState == "error"
	isDone := effState == "done" || effState == "idle"

	if needsAttention {
		m.messageVP.SetContent(m.waitingMessageContent())
	} else if isDone {
		m.messageVP.SetContent(m.finalMessageContent())
	} else if m.tmuxAvailable && hasContent(m.capturedLines) {
		var lines []string
		for _, l := range m.capturedLines {
			lines = append(lines, " "+l)
		}
		m.messageVP.SetContent(strings.Join(lines, "\n"))
	} else {
		m.messageVP.SetContent("")
	}
}

func (m model) agentListContent() string {
	var lines []string

	if len(m.treeNodes) == 0 {
		lines = append(lines, "  No agents found")
		return strings.Join(lines, "\n")
	}

	lastGroup := -1
	for nodeIdx, node := range m.treeNodes {
		agent := m.agents[node.AgentIdx]

		if node.Sub != nil {
			// Subagent node
			isLast := true
			// Check if this is the last subagent in the list
			for nextIdx := nodeIdx + 1; nextIdx < len(m.treeNodes); nextIdx++ {
				next := m.treeNodes[nextIdx]
				if next.AgentIdx != node.AgentIdx {
					break
				}
				if next.Sub != nil {
					isLast = false
					break
				}
			}

			prefix := "├─"
			if isLast {
				prefix = "└─"
			}

			var subIcon string
			if node.Sub.Completed {
				subIcon = lipgloss.NewStyle().Foreground(doneColor).Render("✓")
			} else {
				subIcon = lipgloss.NewStyle().Foreground(runningColor).Render("▶")
			}
			subLabel := node.Sub.AgentType
			if node.Sub.Description != "" {
				maxDesc := m.leftWidth - 12 - len(subLabel)
				desc := node.Sub.Description
				if maxDesc > 0 && len(desc) > maxDesc {
					desc = desc[:maxDesc-1] + "…"
				}
				subLabel += ": " + desc
			}

			line := fmt.Sprintf("       %s %s %s", helpStyle.Render(prefix), subIcon, subLabel)
			if nodeIdx == m.selected {
				line = selectedStyle.Render(fmt.Sprintf("       %s ▶ %s", prefix, subLabel))
			}
			lines = append(lines, line)
			continue
		}

		// Parent agent node
		effState := m.effectiveState(agent)
		group := stateGroup(effState)
		if group == 0 {
			group = 3
		}

		if group != lastGroup {
			if lastGroup != -1 {
				lines = append(lines, "")
			}
			hdr := groupHeaders[group]
			lines = append(lines, " "+lipgloss.NewStyle().
				Foreground(hdr.color).Bold(true).Render(hdr.label))
			lastGroup = group
		}

		si := stateIcons[effState]
		if si.icon == "" {
			si = stateIcons["idle"]
		}

		paneID := fmt.Sprintf("%d.%d", agent.Window, agent.Pane)

		label := ""
		if agent.Branch != "" {
			b := agent.Branch
			b = strings.TrimPrefix(b, "feat/")
			b = strings.TrimPrefix(b, "fix/")
			label = b
		}
		if label == "" && agent.Cwd != "" {
			label = filepath.Base(agent.Cwd)
		}
		if label == "" {
			label = agent.Session
		}

		duration := ""
		if effState == "running" {
			duration = FormatDuration(agent.UpdatedAt)
		}

		maxLabel := m.leftWidth - 5 - len(paneID) - 2 - len(duration)
		if maxLabel > 0 && len(label) > maxLabel {
			label = label[:maxLabel-1] + "…"
		}

		icon := lipgloss.NewStyle().Foreground(si.color).Render(si.icon)
		line := fmt.Sprintf("   %s %s %s  %s", icon, paneID, label, duration)

		if nodeIdx == m.selected {
			line = selectedStyle.Render(fmt.Sprintf("  %s %s %s  %s", si.icon, paneID, label, duration))
		}

		lines = append(lines, line)

		// Metadata badges
		badges := agentBadges(agent)
		if badges != "" {
			lines = append(lines, "       "+badges)
		}

		// Collapse indicator if has subagents
		if subs := m.agentSubagents[agent.Target]; len(subs) > 0 && m.collapsed[agent.Target] {
			lines = append(lines, helpStyle.Render(fmt.Sprintf("       ▸ %d subagents (c to expand)", len(subs))))
		}
	}

	return strings.Join(lines, "\n")
}

func (m model) filesContent(agent Agent) string {
	if len(agent.FilesChanged) == 0 {
		return helpStyle.Render("  No files changed")
	}
	var lines []string
	for _, f := range agent.FilesChanged {
		var color lipgloss.Color
		switch {
		case strings.HasPrefix(f, "+"):
			color = doneColor
		case strings.HasPrefix(f, "-"):
			color = errorColor
		default:
			color = inputColor
		}
		lines = append(lines, "  "+lipgloss.NewStyle().Foreground(color).Render(f))
	}
	return strings.Join(lines, "\n")
}

func (m model) historyContent() string {
	if len(m.conversation) == 0 {
		return helpStyle.Render("  No conversation history")
	}

	var lines []string
	for _, entry := range m.conversation {
		ts := ""
		if t, err := time.Parse(time.RFC3339, entry.Timestamp); err == nil {
			ts = t.Local().Format("15:04")
		}

		roleStyle := lipgloss.NewStyle().Foreground(runningColor).Bold(true)
		if entry.Role == "human" {
			roleStyle = lipgloss.NewStyle().Foreground(inputColor).Bold(true)
		}

		preview := strings.Split(entry.Content, "\n")[0]
		if len(preview) > 120 {
			preview = preview[:119] + "…"
		}

		lines = append(lines, fmt.Sprintf(" %s %s %s",
			helpStyle.Render("["+ts+"]"),
			roleStyle.Render(entry.Role+":"),
			preview))
	}
	return strings.Join(lines, "\n")
}

func (m model) waitingMessageContent() string {
	var lastAssistant *ConversationEntry
	for i := len(m.conversation) - 1; i >= 0; i-- {
		if m.conversation[i].Role == "assistant" {
			lastAssistant = &m.conversation[i]
			break
		}
	}

	if lastAssistant == nil {
		return helpStyle.Render("  Waiting for agent message...")
	}

	var lines []string
	wrapped := wrapText(lastAssistant.Content, m.rightWidth-3)
	for _, wl := range wrapped {
		lines = append(lines, "  "+wl)
	}

	lines = append(lines, "")
	if m.mode == modeReply {
		lines = append(lines, " "+lipgloss.NewStyle().Foreground(inputColor).Bold(true).
			Render("Reply: ")+m.textInput.View())
	} else {
		lines = append(lines, " "+helpStyle.Render("Press r to reply, y/n for quick answer"))
	}

	return strings.Join(lines, "\n")
}

func (m model) finalMessageContent() string {
	var lastAssistant *ConversationEntry
	for i := len(m.conversation) - 1; i >= 0; i-- {
		if m.conversation[i].Role == "assistant" {
			lastAssistant = &m.conversation[i]
			break
		}
	}

	if lastAssistant == nil {
		return ""
	}

	var lines []string
	wrapped := wrapText(lastAssistant.Content, m.rightWidth-3)
	for _, wl := range wrapped {
		lines = append(lines, "  "+wl)
	}
	return strings.Join(lines, "\n")
}

func (m model) usageContent() string {
	var lines []string
	lines = append(lines, costStyle.Render("  USAGE BREAKDOWN"))
	lines = append(lines, "")

	// Per-agent usage
	for _, agent := range m.agents {
		u, ok := m.agentUsage[agent.Target]
		if !ok || u.OutputTokens == 0 {
			continue
		}

		label := agent.Branch
		if label == "" {
			label = filepath.Base(agent.Cwd)
		}
		paneID := fmt.Sprintf("%d.%d", agent.Window, agent.Pane)

		lines = append(lines, fmt.Sprintf("  %s %s %s",
			boldStyle.Render(paneID), label, costStyle.Render(FormatCost(u.CostUSD))))
		lines = append(lines, fmt.Sprintf("    in: %s  out: %s  cache-r: %s  cache-w: %s",
			FormatTokens(u.InputTokens),
			FormatTokens(u.OutputTokens),
			FormatTokens(u.CacheReadTokens),
			FormatTokens(u.CacheWriteTokens)))
		if u.Model != "" {
			lines = append(lines, fmt.Sprintf("    model: %s", helpStyle.Render(u.Model)))
		}
		lines = append(lines, "")
	}

	// Daily cost from DB
	if m.db != nil {
		days := m.db.CostByDay(time.Now().AddDate(0, 0, -7))
		if len(days) > 0 {
			const maxBarWidth = 30
			var maxCost float64
			for _, d := range days {
				if d.CostUSD > maxCost {
					maxCost = d.CostUSD
				}
			}

			lines = append(lines, boldStyle.Render("  DAILY COST (7d)"))
			lines = append(lines, "")
			for _, d := range days {
				width := 0
				if maxCost > 0 {
					width = int(float64(maxBarWidth) * d.CostUSD / maxCost)
				}
				bar := strings.Repeat("█", width)
				lines = append(lines, fmt.Sprintf("  %s  %s %s",
					helpStyle.Render(d.Date),
					costStyle.Render(bar),
					FormatCost(d.CostUSD)))
			}
			lines = append(lines, "")
		}
	}

	// Total — prefer DB (all-time) when available, else session-only
	if m.db != nil && m.dbTotalCost > 0 {
		lines = append(lines, fmt.Sprintf("  All-time: %s  │  Session: in %s  out %s",
			costStyle.Render(FormatCost(m.dbTotalCost)),
			FormatTokens(m.totalUsage.InputTokens),
			FormatTokens(m.totalUsage.OutputTokens)))
	} else {
		lines = append(lines, fmt.Sprintf("  Session: %s  │  in: %s  out: %s",
			costStyle.Render(FormatCost(m.totalUsage.CostUSD)),
			FormatTokens(m.totalUsage.InputTokens),
			FormatTokens(m.totalUsage.OutputTokens)))
	}

	lines = append(lines, "")
	lines = append(lines, helpStyle.Render("  Press u to close"))

	return strings.Join(lines, "\n")
}

// -- Subagent content builders --

func (m model) subagentFilesContent() string {
	// Extract unique files from tool activity
	seen := make(map[string]bool)
	var files []string
	for _, e := range m.subActivity {
		if e.Kind != "tool" {
			continue
		}
		// Parse "→ ToolName: path" format
		content := e.Content
		if !strings.HasPrefix(content, "→ ") {
			continue
		}
		content = content[len("→ "):]
		parts := strings.SplitN(content, ": ", 2)
		if len(parts) != 2 {
			continue
		}
		tool, detail := parts[0], parts[1]
		if tool == "Read" || tool == "Edit" || tool == "Write" {
			if !seen[detail] {
				seen[detail] = true
				files = append(files, detail)
			}
		}
	}
	if len(files) == 0 {
		return helpStyle.Render("  No files touched")
	}
	var lines []string
	for _, f := range files {
		lines = append(lines, "  "+lipgloss.NewStyle().Foreground(inputColor).Render(f))
	}
	return strings.Join(lines, "\n")
}

func (m model) subagentActivityContent() string {
	if len(m.subActivity) == 0 {
		return helpStyle.Render("  No activity yet")
	}
	var lines []string
	for _, e := range m.subActivity {
		ts := ""
		if t, err := time.Parse(time.RFC3339, e.Timestamp); err == nil {
			ts = t.Local().Format("15:04")
		}
		switch e.Kind {
		case "tool":
			lines = append(lines, fmt.Sprintf(" %s %s",
				helpStyle.Render("["+ts+"]"),
				lipgloss.NewStyle().Foreground(lipgloss.Color("244")).Render(e.Content)))
		case "human":
			lines = append(lines, fmt.Sprintf(" %s %s %s",
				helpStyle.Render("["+ts+"]"),
				lipgloss.NewStyle().Foreground(inputColor).Bold(true).Render("prompt:"),
				truncateLineStr(e.Content, m.rightWidth-20)))
		case "assistant":
			preview := strings.Split(e.Content, "\n")[0]
			lines = append(lines, fmt.Sprintf(" %s %s %s",
				helpStyle.Render("["+ts+"]"),
				lipgloss.NewStyle().Foreground(runningColor).Bold(true).Render("text:"),
				truncateLineStr(preview, m.rightWidth-20)))
		}
	}
	return strings.Join(lines, "\n")
}

func (m model) subagentOutputContent() string {
	// Find the last assistant text block
	var lastText string
	for i := len(m.subActivity) - 1; i >= 0; i-- {
		if m.subActivity[i].Kind == "assistant" {
			lastText = m.subActivity[i].Content
			break
		}
	}
	if lastText == "" {
		return helpStyle.Render("  No output yet")
	}
	var lines []string
	for _, wl := range wrapText(lastText, m.rightWidth-3) {
		lines = append(lines, "  "+wl)
	}
	return strings.Join(lines, "\n")
}

func truncateLineStr(s string, maxLen int) string {
	if maxLen > 0 && len(s) > maxLen {
		return s[:maxLen-1] + "…"
	}
	return s
}

// formatActivityLog renders activity entries for the inspect viewport.
// Shows full conversation with wrapped text — like reading the actual logs.
// -- View --

func (m model) View() string {
	if m.width == 0 || m.height == 0 {
		return "Loading..."
	}

	left := m.renderLeftPanel()
	right := m.renderRightPanel()
	main := lipgloss.JoinHorizontal(lipgloss.Top, left, right)

	help := m.renderHelpBar()

	return lipgloss.JoinVertical(lipgloss.Left, main, help)
}

func (m model) renderLeftPanel() string {
	panelHeight := m.height - 5
	style := borderStyle
	if m.focusedVP == focusAgentList {
		style = style.BorderForeground(lipgloss.Color("86"))
	}
	return style.
		Width(m.leftWidth).
		Height(panelHeight).
		Render(m.agentListVP.View())
}

func (m model) renderRightPanel() string {
	panelHeight := m.height - 5

	agent := m.selectedAgent()
	if agent == nil {
		return borderStyle.
			Width(m.rightWidth).
			Height(panelHeight).
			Render(m.messageVP.View())
	}

	sub := m.selectedSubagent()

	// Header (not in a viewport — static)
	var header []string

	if sub != nil {
		// Subagent header
		header = append(header, titleStyle.Render(fmt.Sprintf(" %s: %s ", sub.AgentType, sub.Description)))
		header = append(header, "")
		header = append(header, fmt.Sprintf(" Parent: %d.%d %s", agent.Window, agent.Pane, agent.Branch))
		header = append(header, "")
	} else {
		// Parent agent header
		name := agent.Session
		if name == "" {
			name = agent.Target
		}
		header = append(header, titleStyle.Render(fmt.Sprintf(" PEEK: %s ", name)))
		header = append(header, "")

		effState := m.effectiveState(*agent)
		si := stateIcons[effState]
		if si.icon == "" {
			si = stateIcons["idle"]
		}
		stateLabel := map[string]string{
			"input": "Waiting for input", "error": "Error",
			"running": "Running", "done": "Done", "idle": "Idle",
		}[effState]
		if stateLabel == "" {
			stateLabel = agent.State
		}
		stateStr := lipgloss.NewStyle().Foreground(si.color).Bold(true).
			Render(fmt.Sprintf("%s %s", si.icon, stateLabel))

		metaParts := []string{stateStr}
		if agent.Model != "" {
			metaParts = append(metaParts, helpStyle.Render(agent.Model))
		}
		if agent.PermissionMode != "" && agent.PermissionMode != "default" {
			metaParts = append(metaParts, lipgloss.NewStyle().Foreground(inputColor).Render(agent.PermissionMode))
		}
		header = append(header, " "+strings.Join(metaParts, helpStyle.Render(" │ ")))
		header = append(header, "")

		if agent.Branch != "" {
			header = append(header, fmt.Sprintf(" Branch: %s", boldStyle.Render(agent.Branch)))
		}
		if agent.Cwd != "" {
			header = append(header, fmt.Sprintf(" Dir: %s", agent.Cwd))
		}

		if u, ok := m.agentUsage[agent.Target]; ok && u.OutputTokens > 0 {
			header = append(header, fmt.Sprintf(" Cost: %s  (in: %s  out: %s  cache: %s)",
				boldStyle.Render(FormatCost(u.CostUSD)),
				FormatTokens(u.InputTokens),
				FormatTokens(u.OutputTokens),
				FormatTokens(u.CacheReadTokens+u.CacheWriteTokens)))
		}

		if agent.SubagentCount > 0 {
			header = append(header, fmt.Sprintf(" Subagents: %s active",
				lipgloss.NewStyle().Foreground(runningColor).Bold(true).
					Render(fmt.Sprintf("%d", agent.SubagentCount))))
		}
		header = append(header, "")
	}

	// Section labels + viewports
	focusMarker := func(vp int) string {
		if m.focusedVP == vp {
			return lipgloss.NewStyle().Foreground(lipgloss.Color("86")).Render(" ◆")
		}
		return ""
	}

	scrollHint := func(vp viewport.Model) string {
		var hints []string
		if !vp.AtTop() {
			hints = append(hints, "▲")
		}
		if !vp.AtBottom() {
			hints = append(hints, "▼")
		}
		if len(hints) == 0 {
			return ""
		}
		return " " + helpStyle.Render(strings.Join(hints, " "))
	}

	var filesLabel, historyLabel, messageLabel string

	if m.mode == modeUsage {
		filesLabel = ""
		historyLabel = ""
		messageLabel = " " + lipgloss.NewStyle().Foreground(lipgloss.Color("214")).Bold(true).
			Render("── Usage") + focusMarker(focusMessage) + scrollHint(m.messageVP) +
			" " + helpStyle.Render(strings.Repeat("─", 20))
	} else if sub != nil {
		filesLabel = " " + boldStyle.Render("── Files Touched") + focusMarker(focusFiles) + scrollHint(m.filesVP) +
			" " + helpStyle.Render(strings.Repeat("─", 12))
		historyLabel = " " + boldStyle.Render("── Activity") + focusMarker(focusHistory) + scrollHint(m.historyVP) +
			" " + helpStyle.Render(strings.Repeat("─", 17))
		messageLabel = " " + boldStyle.Render("── Output") + focusMarker(focusMessage) + scrollHint(m.messageVP) +
			" " + helpStyle.Render(strings.Repeat("─", 19))
	} else {
		rpEffState := m.effectiveState(*agent)
		needsAttention := rpEffState == "input" || rpEffState == "error"
		isDone := rpEffState == "done" || rpEffState == "idle"

		filesLabel = " " + boldStyle.Render("Files:") + focusMarker(focusFiles) + scrollHint(m.filesVP)
		historyLabel = " " + boldStyle.Render("── History") + focusMarker(focusHistory) + scrollHint(m.historyVP) +
			" " + helpStyle.Render(strings.Repeat("─", 18))

		if needsAttention {
			messageLabel = " " + lipgloss.NewStyle().Foreground(inputColor).Bold(true).
				Render("── Agent is waiting") + focusMarker(focusMessage) + scrollHint(m.messageVP) +
				" " + helpStyle.Render(strings.Repeat("─", 9))
		} else if isDone {
			messageLabel = " " + lipgloss.NewStyle().Foreground(doneColor).Bold(true).
				Render("── Final message") + focusMarker(focusMessage) + scrollHint(m.messageVP) +
				" " + helpStyle.Render(strings.Repeat("─", 12))
		} else {
			messageLabel = " " + boldStyle.Render("── Live") + focusMarker(focusMessage) + scrollHint(m.messageVP) +
				" " + helpStyle.Render(strings.Repeat("─", 21))
		}
	}

	// Status message
	statusLine := ""
	if m.statusMsg != "" {
		statusLine = " " + lipgloss.NewStyle().Foreground(errorColor).Render(m.statusMsg)
	}

	// Compose right panel (with blank-line buffers between sections)
	var parts []string
	if m.mode == modeUsage {
		parts = []string{
			strings.Join(header, "\n"),
			messageLabel,
			m.messageVP.View(),
		}
	} else {
		parts = []string{
			strings.Join(header, "\n"),
			filesLabel,
			m.filesVP.View(),
			"",
			historyLabel,
			m.historyVP.View(),
			"",
			messageLabel,
			m.messageVP.View(),
		}
	}
	if statusLine != "" {
		parts = append(parts, statusLine)
	}

	content := strings.Join(parts, "\n")

	return borderStyle.
		Width(m.rightWidth).
		Height(panelHeight).
		Render(content)
}

var groupHeaders = map[int]struct {
	label string
	color lipgloss.Color
}{
	1: {"NEEDS ATTENTION", inputColor},
	2: {"RUNNING", runningColor},
	3: {"COMPLETED", doneColor},
}

func stateGroup(state string) int {
	return statePriority[state]
}

func (m model) renderHelpBar() string {
	var parts []string

	totalCost := m.dbTotalCost
	if totalCost == 0 {
		totalCost = m.totalUsage.CostUSD
	}
	if totalCost > 0 {
		costStr := lipgloss.NewStyle().Foreground(lipgloss.Color("214")).Bold(true).
			Render(FormatCost(totalCost))
		parts = append(parts, fmt.Sprintf("Total: %s", costStr))
		parts = append(parts, "│")
	}

	parts = append(parts, boldStyle.Render("↑/↓")+" navigate")

	if m.mode == modeReply {
		parts = append(parts, boldStyle.Render("enter")+" send")
		parts = append(parts, boldStyle.Render("esc")+" cancel")
		return helpStyle.Render("  " + strings.Join(parts, "  "))
	}

	if m.tmuxAvailable {
		parts = append(parts, boldStyle.Render("enter")+" jump")
		parts = append(parts, boldStyle.Render("r")+" reply")
		if agent := m.selectedAgent(); agent != nil && m.selectedSubagent() == nil {
			es := m.effectiveState(*agent)
			if es == "input" || es == "error" {
				parts = append(parts, boldStyle.Render("y/n")+" quick answer")
			}
		}
	} else {
		parts = append(parts, helpStyle.Render("enter")+" "+helpStyle.Render("jump"))
		parts = append(parts, helpStyle.Render("r")+" "+helpStyle.Render("reply"))
	}
	parts = append(parts, boldStyle.Render("u")+" usage")
	parts = append(parts, boldStyle.Render("c")+" collapse")
	parts = append(parts, boldStyle.Render("tab")+" focus")
	parts = append(parts, boldStyle.Render("^u/^d")+" scroll")
	parts = append(parts, boldStyle.Render("q")+" quit")

	return helpStyle.Render("  " + strings.Join(parts, "  "))
}

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

// -- Helpers --

// modelShort returns a single-letter model indicator with color.
func modelShort(model string) string {
	m := strings.ToLower(model)
	switch {
	case strings.Contains(m, "opus"):
		return lipgloss.NewStyle().Foreground(lipgloss.Color("213")).Render("O")
	case strings.Contains(m, "sonnet"):
		return lipgloss.NewStyle().Foreground(lipgloss.Color("117")).Render("S")
	case strings.Contains(m, "haiku"):
		return lipgloss.NewStyle().Foreground(lipgloss.Color("114")).Render("H")
	}
	return ""
}

// agentBadges returns a compact metadata string like "S auto [2]".
func agentBadges(agent Agent) string {
	var parts []string
	if ms := modelShort(agent.Model); ms != "" {
		parts = append(parts, ms)
	}
	if agent.PermissionMode != "" && agent.PermissionMode != "default" {
		parts = append(parts, helpStyle.Render(agent.PermissionMode))
	}
	if agent.SubagentCount > 0 {
		parts = append(parts, lipgloss.NewStyle().Foreground(runningColor).
			Render(fmt.Sprintf("[%d]", agent.SubagentCount)))
	}
	if len(parts) == 0 {
		return ""
	}
	return strings.Join(parts, " ")
}

// effectiveState returns the display state for an agent, overriding "running"
// to "input" when there's a pending tool_use and the last hook event is Stop.
// Stop is the only event where the agent has finished its turn — a pending
// tool_use at that point means the agent is waiting for user permission.
// During PreToolUse/PostToolUse/SessionStart/SubagentStart/SubagentStop,
// tools are actively being processed (hooks may still be running).
func (m model) effectiveState(agent Agent) string {
	if agent.State == "running" && m.pendingInput[agent.Target] {
		if agent.LastHookEvent == "Stop" {
			return "input"
		}
	}
	return agent.State
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

func hasContent(lines []string) bool {
	for _, l := range lines {
		if strings.TrimSpace(l) != "" {
			return true
		}
	}
	return false
}

func wrapText(s string, width int) []string {
	if width <= 0 {
		return []string{s}
	}
	var result []string
	for _, paragraph := range strings.Split(s, "\n") {
		if paragraph == "" {
			result = append(result, "")
			continue
		}
		words := strings.Fields(paragraph)
		if len(words) == 0 {
			result = append(result, "")
			continue
		}
		line := words[0]
		for _, w := range words[1:] {
			if len(line)+1+len(w) > width {
				result = append(result, line)
				line = w
			} else {
				line += " " + w
			}
		}
		result = append(result, line)
	}
	return result
}
