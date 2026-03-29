package main

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
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

// -- Modes --

const (
	modeNormal = iota
	modeReply
)

// -- Model --

type model struct {
	agents        []Agent
	selected      int
	width, height int
	mode          int
	textInput     textinput.Model
	tmuxAvailable bool
	statePath     string
	selfTarget    string // dashboard's own pane — excluded from list
	statusMsg     string
	capturedLines []string
	conversation  []ConversationEntry
	convOffset    int // scroll offset for conversation
	tickCount     int // counts 1s ticks for less frequent tasks
	agentUsage    map[string]Usage
	totalUsage    Usage
	db            *DB
	dbTotalCost   float64 // all-time cost from DB
}

func newModel(statePath, selfTarget string, db *DB) model {
	ti := textinput.New()
	ti.Placeholder = "Type reply..."
	ti.CharLimit = 4096

	return model{
		agents:        nil,
		statePath:     statePath,
		selfTarget:    selfTarget,
		tmuxAvailable: TmuxIsAvailable(),
		textInput:     ti,
		mode:          modeNormal,
		db:            db,
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
		return m, nil

	case stateUpdatedMsg:
		m.agents = SortedAgents(msg.state, m.selfTarget)
		if m.selected >= len(m.agents) {
			m.selected = max(0, len(m.agents)-1)
		}
		return m, tea.Batch(m.captureSelected(), m.loadConversation(), loadUsage(m.agents))

	case conversationMsg:
		prevLen := len(m.conversation)
		m.conversation = msg.entries
		// On first load, jump to the end
		if prevLen == 0 {
			if len(m.conversation) > 10 {
				m.convOffset = len(m.conversation) - 10
			}
		}
		// Clamp if conversation shrunk
		maxOffset := max(0, len(m.conversation)-10)
		if m.convOffset > maxOffset {
			m.convOffset = maxOffset
		}
		return m, nil

	case tickMsg:
		m.tickCount++
		cmds := []tea.Cmd{tickEvery(), m.captureSelected(), m.loadConversation()}
		if m.tickCount%10 == 0 {
			cmds = append(cmds, pruneDead(m.statePath), loadUsage(m.agents))
		}
		return m, tea.Batch(cmds...)

	case usageMsg:
		m.agentUsage = msg.perAgent
		m.totalUsage = msg.total
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

	case pruneDeadMsg:
		if msg.removed > 0 {
			// Reload state to reflect removals
			return m, loadState(m.statePath)
		}
		return m, nil

	case captureResultMsg:
		m.capturedLines = msg.lines
		return m, nil

	case jumpResultMsg:
		if msg.err != nil {
			m.statusMsg = fmt.Sprintf("Jump failed: %v", msg.err)
		} else {
			m.statusMsg = "Jumped — switch back to this window for dashboard"
		}
		return m, nil

	case sendResultMsg:
		if msg.err != nil {
			m.statusMsg = fmt.Sprintf("Reply failed: %v", msg.err)
		} else {
			m.statusMsg = "Reply sent"
		}
		return m, nil

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

func (m model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	key := msg.String()

	// Reply mode
	if m.mode == modeReply {
		switch key {
		case "enter":
			text := m.textInput.Value()
			m.mode = modeNormal
			m.textInput.Reset()
			if text != "" && m.selected < len(m.agents) {
				target := m.agents[m.selected].Target
				return m, sendReply(target, text)
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
			m.conversation = nil // trigger jump-to-end on next load
			m.convOffset = 0
			return m, tea.Batch(m.captureSelected(), m.loadConversation())
		}
	case "down", "j":
		if m.selected < len(m.agents)-1 {
			m.selected++
			m.statusMsg = ""
			m.conversation = nil // trigger jump-to-end on next load
			m.convOffset = 0
			return m, tea.Batch(m.captureSelected(), m.loadConversation())
		}
	case "ctrl+u":
		if m.convOffset > 0 {
			m.convOffset -= 5
			if m.convOffset < 0 {
				m.convOffset = 0
			}
		}
		return m, nil
	case "ctrl+d":
		maxOffset := max(0, len(m.conversation)-10)
		if m.convOffset < maxOffset {
			m.convOffset += 5
			if m.convOffset > maxOffset {
				m.convOffset = maxOffset
			}
		}
		return m, nil
	case "enter":
		if !m.tmuxAvailable {
			m.statusMsg = "Cannot jump: tmux not detected"
			return m, nil
		}
		if m.selected < len(m.agents) {
			target := m.agents[m.selected].Target
			return m, jumpToAgent(target)
		}
	case "r":
		if !m.tmuxAvailable {
			m.statusMsg = "Cannot reply: tmux not detected"
			return m, nil
		}
		if m.selected < len(m.agents) {
			m.mode = modeReply
			m.textInput.Focus()
			return m, textinput.Blink
		}
	case "y", "n":
		// Quick yes/no for needs-attention agents
		if m.tmuxAvailable && m.selected < len(m.agents) {
			agent := m.agents[m.selected]
			if agent.State == "input" || agent.State == "error" {
				return m, sendRawKey(agent.Target, key)
			}
		}
	case "1", "2", "3", "4", "5", "6", "7", "8", "9":
		// Quick number selection for needs-attention agents
		if m.tmuxAvailable && m.selected < len(m.agents) {
			agent := m.agents[m.selected]
			if agent.State == "input" || agent.State == "error" {
				return m, sendRawKey(agent.Target, key)
			}
		}
	}

	return m, nil
}

func (m model) View() string {
	if m.width == 0 || m.height == 0 {
		return "Loading..."
	}

	// Width/Height set content area; borders add +2 each dimension
	leftWidth := m.width*30/100 - 2       // content width (total = leftWidth+2)
	rightWidth := m.width - leftWidth - 4 // remaining content width (total = rightWidth+2)
	panelHeight := m.height - 5           // content height (total = panelHeight+2, +1 help bar, +2 bottom buffer)

	left := m.renderAgentList(leftWidth, panelHeight)
	right := m.renderPeekPanel(rightWidth, panelHeight)
	main := lipgloss.JoinHorizontal(lipgloss.Top, left, right)

	help := m.renderHelpBar()

	return lipgloss.JoinVertical(lipgloss.Left, main, help)
}

// stateGroup returns the priority group for a state.
func stateGroup(state string) int {
	return statePriority[state]
}

var groupHeaders = map[int]struct {
	label string
	color lipgloss.Color
}{
	1: {"NEEDS ATTENTION", inputColor},
	2: {"RUNNING", runningColor},
	3: {"COMPLETED", doneColor},
}

func (m model) renderAgentList(width, height int) string {
	var lines []string

	if len(m.agents) == 0 {
		lines = append(lines, "  No agents found")
	} else {
		lastGroup := -1
		for i, agent := range m.agents {
			group := stateGroup(agent.State)
			if group == 0 {
				group = 3
			}

			// Insert group header when group changes
			if group != lastGroup {
				if lastGroup != -1 {
					lines = append(lines, "") // spacer between groups
				}
				hdr := groupHeaders[group]
				lines = append(lines, " "+lipgloss.NewStyle().
					Foreground(hdr.color).Bold(true).Render(hdr.label))
				lastGroup = group
			}

			si := stateIcons[agent.State]
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
			if agent.State == "running" {
				duration = FormatDuration(agent.UpdatedAt)
			}

			overhead := 5 + len(paneID) + 2 + len(duration) // indent+icon+spaces+paneID+gap+duration
			maxLabel := width - overhead
			if maxLabel > 0 && len(label) > maxLabel {
				label = label[:maxLabel-1] + "…"
			}

			icon := lipgloss.NewStyle().Foreground(si.color).Render(si.icon)
			line := fmt.Sprintf("   %s %s %s  %s", icon, paneID, label, duration)

			if i == m.selected {
				line = selectedStyle.Render(fmt.Sprintf("  %s %s %s  %s", si.icon, paneID, label, duration))
			}

			lines = append(lines, line)
		}
	}

	agentContent := fitContent(lines, width, height)

	return borderStyle.
		Width(width).
		Height(height).
		Render(agentContent)
}

func (m model) renderPeekPanel(width, height int) string {
	var lines []string

	if m.selected >= len(m.agents) || len(m.agents) == 0 {
		lines = append(lines, "")
		lines = append(lines, "  No agents found")
	} else {
		agent := m.agents[m.selected]
		si := stateIcons[agent.State]
		if si.icon == "" {
			si = stateIcons["idle"]
		}

		// Header
		name := agent.Session
		if name == "" {
			name = agent.Target
		}
		lines = append(lines, titleStyle.Render(fmt.Sprintf(" PEEK: %s ", name)))
		lines = append(lines, "")

		// State + duration
		stateLabel := map[string]string{
			"input": "Waiting for input", "error": "Error",
			"running": "Running", "done": "Done", "idle": "Idle",
		}[agent.State]
		if stateLabel == "" {
			stateLabel = agent.State
		}
		stateStr := lipgloss.NewStyle().Foreground(si.color).Bold(true).
			Render(fmt.Sprintf("%s %s", si.icon, stateLabel))
		lines = append(lines, fmt.Sprintf(" %s  (%s)", stateStr, FormatDuration(agent.UpdatedAt)))
		lines = append(lines, "")

		// Branch + cwd
		if agent.Branch != "" {
			lines = append(lines, fmt.Sprintf(" Branch: %s", boldStyle.Render(agent.Branch)))
		}
		if agent.Cwd != "" {
			lines = append(lines, fmt.Sprintf(" Dir: %s", agent.Cwd))
		}
		lines = append(lines, "")

		// Usage / cost
		if u, ok := m.agentUsage[agent.Target]; ok && u.OutputTokens > 0 {
			lines = append(lines, fmt.Sprintf(" Cost: %s  (in: %s  out: %s  cache: %s)",
				boldStyle.Render(FormatCost(u.CostUSD)),
				FormatTokens(u.InputTokens),
				FormatTokens(u.OutputTokens),
				FormatTokens(u.CacheReadTokens+u.CacheWriteTokens)))
			lines = append(lines, "")
		}

		// Files changed
		if len(agent.FilesChanged) > 0 {
			lines = append(lines, " "+boldStyle.Render("Files:"))
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
				lines = append(lines, "   "+lipgloss.NewStyle().Foreground(color).Render(f))
			}
			lines = append(lines, "")
		}

		needsAttention := agent.State == "input" || agent.State == "error"

		if needsAttention && len(m.conversation) > 0 {
			// Show the last assistant message in full so user can read and reply
			lines = append(lines, " "+lipgloss.NewStyle().Foreground(inputColor).Bold(true).
				Render("── Agent is waiting ──────────"))

			// Find last assistant message
			var lastAssistant *ConversationEntry
			for i := len(m.conversation) - 1; i >= 0; i-- {
				if m.conversation[i].Role == "assistant" {
					lastAssistant = &m.conversation[i]
					break
				}
			}

			if lastAssistant != nil {
				lines = append(lines, "")
				// Word-wrap the full content to panel width
				wrapped := wrapText(lastAssistant.Content, width-3)
				for _, wl := range wrapped {
					lines = append(lines, "  "+wl)
				}
			}

			lines = append(lines, "")

			// Reply prompt
			if m.mode == modeReply {
				lines = append(lines, " "+lipgloss.NewStyle().Foreground(inputColor).Bold(true).
					Render("Reply: ")+m.textInput.View())
			} else {
				lines = append(lines, " "+helpStyle.Render("Press r to reply, y/n for quick answer"))
			}
		} else if len(m.conversation) > 0 {
			isDone := agent.State == "done" || agent.State == "idle"

			// Fixed-height scrollable history viewport (10 lines)
			const historyRows = 10

			lines = append(lines, " "+boldStyle.Render("── History ───────────────────"))

			// Build all compact history lines
			var histLines []string
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

				histLines = append(histLines, fmt.Sprintf(" %s %s %s",
					helpStyle.Render("["+ts+"]"),
					roleStyle.Render(entry.Role+":"),
					preview))
			}

			// Apply scroll offset within fixed viewport
			viewStart := m.convOffset
			if viewStart > len(histLines) {
				viewStart = max(0, len(histLines)-historyRows)
			}
			viewEnd := viewStart + historyRows
			if viewEnd > len(histLines) {
				viewEnd = len(histLines)
			}

			if viewStart > 0 {
				lines = append(lines, " "+helpStyle.Render(fmt.Sprintf("  ▲ %d more (ctrl+u)", viewStart)))
			}
			for i := viewStart; i < viewEnd; i++ {
				lines = append(lines, histLines[i])
			}
			// Pad to fixed height so content below doesn't shift
			for i := viewEnd - viewStart; i < historyRows; i++ {
				lines = append(lines, "")
			}
			if viewEnd < len(histLines) {
				lines = append(lines, " "+helpStyle.Render(fmt.Sprintf("  ▼ %d more (ctrl+d)", len(histLines)-viewEnd)))
			} else {
				lines = append(lines, "") // keep consistent height
			}

			// For done agents, always show last assistant message in full at the bottom
			if isDone {
				var lastAssistant *ConversationEntry
				for i := len(m.conversation) - 1; i >= 0; i-- {
					if m.conversation[i].Role == "assistant" {
						lastAssistant = &m.conversation[i]
						break
					}
				}
				if lastAssistant != nil {
					lines = append(lines, "")
					lines = append(lines, " "+lipgloss.NewStyle().Foreground(doneColor).Bold(true).
						Render("── Final message ─────────────"))
					lines = append(lines, "")
					wrapped := wrapText(lastAssistant.Content, width-3)
					for _, wl := range wrapped {
						lines = append(lines, "  "+wl)
					}
				}
			}
		} else if m.tmuxAvailable && hasContent(m.capturedLines) {
			// Fallback to tmux capture
			lines = append(lines, " "+boldStyle.Render("── Live ──────────────────────"))
			for _, l := range m.capturedLines {
				lines = append(lines, " "+l)
			}
		} else if agent.LastMessagePreview != "" {
			lines = append(lines, " "+boldStyle.Render("── Last Message ──────────────"))
			lines = append(lines, " "+agent.LastMessagePreview)
		}

		if !m.tmuxAvailable {
			lines = append(lines, "")
			lines = append(lines, " "+helpStyle.Render("tmux not detected — jump and reply disabled"))
		}

		// Status message
		if m.statusMsg != "" {
			lines = append(lines, "")
			lines = append(lines, " "+lipgloss.NewStyle().Foreground(errorColor).Render(m.statusMsg))
		}
	}

	content := fitContent(lines, width, height)

	return borderStyle.
		Width(width).
		Height(height).
		Render(content)
}

func (m model) renderHelpBar() string {
	var parts []string

	// Total cost on the left — DB total (all-time) or in-memory fallback
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
		// Show quick-action hints for needs-attention agents
		if m.selected < len(m.agents) {
			agent := m.agents[m.selected]
			if agent.State == "input" || agent.State == "error" {
				parts = append(parts, boldStyle.Render("y/n")+" quick answer")
			}
		}
	} else {
		parts = append(parts, helpStyle.Render("enter")+" "+helpStyle.Render("jump"))
		parts = append(parts, helpStyle.Render("r")+" "+helpStyle.Render("reply"))
	}
	parts = append(parts, boldStyle.Render("^u/^d")+" scroll")
	parts = append(parts, boldStyle.Render("q")+" quit")

	return helpStyle.Render("  " + strings.Join(parts, "  "))
}

// -- Commands --

func (m model) captureSelected() tea.Cmd {
	if !m.tmuxAvailable || m.selected >= len(m.agents) {
		return nil
	}
	target := m.agents[m.selected].Target
	return func() tea.Msg {
		lines, err := TmuxCapture(target, 15)
		if err != nil {
			return captureResultMsg{lines: nil}
		}
		return captureResultMsg{lines: lines}
	}
}

func (m model) loadConversation() tea.Cmd {
	if m.selected >= len(m.agents) {
		return nil
	}
	agent := m.agents[m.selected]
	if agent.Cwd == "" {
		return nil
	}
	slug := ProjectSlug(agent.Cwd)
	projDir := filepath.Join(ConversationsDir(), slug)
	sessionID := agent.SessionID
	cwd := agent.Cwd

	return func() tea.Msg {
		// Fallback: if no session_id in state, find by cwd
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
	// Copy data for goroutine
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
	// Copy to avoid race
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
		// Try adding the directory instead (file might not exist yet)
		dir := filepath.Dir(path)
		if dirErr := watcher.Add(dir); dirErr != nil {
			watcher.Close()
			return nil, fmt.Errorf("cannot watch %s: %w", path, err)
		}
	}

	return watcher, nil
}

// -- Helpers --

func hasContent(lines []string) bool {
	for _, l := range lines {
		if strings.TrimSpace(l) != "" {
			return true
		}
	}
	return false
}

// wrapText wraps a string to the given width, breaking on word boundaries.
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

// fitContent constrains lines to exactly width x height (visual chars).
// Truncates long lines, truncates excess lines, pads short content.
func fitContent(lines []string, width, height int) string {
	out := make([]string, height)
	for i := 0; i < height; i++ {
		if i < len(lines) {
			out[i] = truncateLine(lines[i], width)
		}
	}
	return strings.Join(out, "\n")
}

// truncateLine truncates a string to maxWidth visual characters,
// accounting for ANSI escape sequences (which have zero width).
func truncateLine(s string, maxWidth int) string {
	if lipgloss.Width(s) <= maxWidth {
		return s
	}
	// Walk runes, track visual width, preserve ANSI sequences
	var b strings.Builder
	w := 0
	inEsc := false
	for _, r := range s {
		if r == '\x1b' {
			inEsc = true
			b.WriteRune(r)
			continue
		}
		if inEsc {
			b.WriteRune(r)
			if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
				inEsc = false
			}
			continue
		}
		rw := lipgloss.Width(string(r))
		if w+rw > maxWidth {
			break
		}
		b.WriteRune(r)
		w += rw
	}
	return b.String()
}
