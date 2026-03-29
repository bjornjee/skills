package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

func truncateLineStr(s string, maxLen int) string {
	if maxLen > 0 && len(s) > maxLen {
		return s[:maxLen-1] + "…"
	}
	return s
}

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
