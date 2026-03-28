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
	statusMsg     string
	capturedLines []string
}

func newModel(statePath string) model {
	ti := textinput.New()
	ti.Placeholder = "Type reply..."
	ti.CharLimit = 4096

	return model{
		agents:        nil,
		statePath:     statePath,
		tmuxAvailable: TmuxIsAvailable(),
		textInput:     ti,
		mode:          modeNormal,
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		loadState(m.statePath),
		tickEvery(),
		m.captureSelected(),
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case stateUpdatedMsg:
		m.agents = SortedAgents(msg.state)
		if m.selected >= len(m.agents) {
			m.selected = max(0, len(m.agents)-1)
		}
		return m, m.captureSelected()

	case tickMsg:
		return m, tea.Batch(tickEvery(), m.captureSelected())

	case captureResultMsg:
		m.capturedLines = msg.lines
		return m, nil

	case jumpResultMsg:
		if msg.err != nil {
			m.statusMsg = fmt.Sprintf("Jump failed: %v", msg.err)
			return m, nil
		}
		return m, tea.Quit

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
			return m, m.captureSelected()
		}
	case "down", "j":
		if m.selected < len(m.agents)-1 {
			m.selected++
			m.statusMsg = ""
			return m, m.captureSelected()
		}
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
	}

	return m, nil
}

func (m model) View() string {
	if m.width == 0 || m.height == 0 {
		return "Loading..."
	}

	leftWidth := m.width * 30 / 100
	rightWidth := m.width - leftWidth - 2 // account for borders
	contentHeight := m.height - 3          // help bar

	left := m.renderAgentList(leftWidth, contentHeight)
	right := m.renderPeekPanel(rightWidth, contentHeight)
	main := lipgloss.JoinHorizontal(lipgloss.Top, left, right)

	help := m.renderHelpBar()

	return lipgloss.JoinVertical(lipgloss.Left, main, help)
}

func (m model) renderAgentList(width, height int) string {
	var lines []string

	if len(m.agents) == 0 {
		lines = append(lines, "  No agents found")
	} else {
		for i, agent := range m.agents {
			si := stateIcons[agent.State]
			if si.icon == "" {
				si = stateIcons["idle"]
			}

			name := agent.Session
			if name == "" {
				name = agent.Target
			}
			branch := ""
			if agent.Branch != "" {
				b := agent.Branch
				b = strings.TrimPrefix(b, "feat/")
				branch = ":" + b
			}
			duration := FormatDuration(agent.UpdatedAt)

			icon := lipgloss.NewStyle().Foreground(si.color).Render(si.icon)
			label := fmt.Sprintf("%s%s", name, branch)
			line := fmt.Sprintf(" %s %s  %s", icon, label, duration)

			if i == m.selected {
				line = selectedStyle.Render(fmt.Sprintf(">%s %s  %s", si.icon, label, duration))
			}

			lines = append(lines, line)
		}
	}

	content := strings.Join(lines, "\n")

	innerHeight := height - 2 // border
	// Pad to fill height
	lineCount := len(lines)
	for lineCount < innerHeight {
		content += "\n"
		lineCount++
	}

	return borderStyle.
		Width(width).
		Height(height - 2).
		Render(titleStyle.Render(" AGENTS ") + "\n" + content)
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

		// Conversation (cached tmux capture) or last message
		if m.tmuxAvailable && hasContent(m.capturedLines) {
			lines = append(lines, " "+boldStyle.Render("── Conversation ──────────────"))
			for _, l := range m.capturedLines {
				lines = append(lines, " "+l)
			}
			lines = append(lines, " "+boldStyle.Render("──────────────────────────────"))
		} else if agent.LastMessagePreview != "" {
			lines = append(lines, " "+boldStyle.Render("── Last Message ──────────────"))
			lines = append(lines, " "+agent.LastMessagePreview)
			lines = append(lines, " "+boldStyle.Render("──────────────────────────────"))
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

	content := strings.Join(lines, "\n")

	return borderStyle.
		Width(width).
		Height(height - 2).
		Render(content)
}

func (m model) renderHelpBar() string {
	var parts []string

	parts = append(parts, boldStyle.Render("↑/↓")+" navigate")

	if m.mode == modeReply {
		parts = append(parts, boldStyle.Render("enter")+" send")
		parts = append(parts, boldStyle.Render("esc")+" cancel")
		input := m.textInput.View()
		return helpStyle.Render("  "+strings.Join(parts, "  ")) + "  " + input
	}

	if m.tmuxAvailable {
		parts = append(parts, boldStyle.Render("enter")+" jump")
		parts = append(parts, boldStyle.Render("r")+" reply")
	} else {
		parts = append(parts, helpStyle.Render("enter")+" "+helpStyle.Render("jump"))
		parts = append(parts, helpStyle.Render("r")+" "+helpStyle.Render("reply"))
	}
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

