package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"
)

// Agent represents a single Claude Code agent's state.
type Agent struct {
	Target             string   `json:"target"`
	Session            string   `json:"session"`
	Window             int      `json:"window"`
	Pane               int      `json:"pane"`
	State              string   `json:"state"`
	Cwd                string   `json:"cwd"`
	Branch             string   `json:"branch"`
	StartedAt          string   `json:"started_at"`
	UpdatedAt          string   `json:"updated_at"`
	LastMessagePreview string   `json:"last_message_preview"`
	FilesChanged       []string `json:"files_changed"`
}

// StateFile is the top-level JSON structure.
type StateFile struct {
	Agents map[string]Agent `json:"agents"`
}

var statePriority = map[string]int{
	"input":   1,
	"error":   2,
	"running": 3,
	"idle":    4,
	"done":    5,
}

// DefaultStatePath returns ~/.claude/agent-dashboard/state.json.
func DefaultStatePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "/tmp/agent-dashboard/state.json"
	}
	return filepath.Join(home, ".claude", "agent-dashboard", "state.json")
}

// ReadState reads and parses the state file. Returns empty state on any error.
func ReadState(path string) StateFile {
	data, err := os.ReadFile(path)
	if err != nil {
		return StateFile{Agents: make(map[string]Agent)}
	}

	var sf StateFile
	if err := json.Unmarshal(data, &sf); err != nil {
		return StateFile{Agents: make(map[string]Agent)}
	}

	if sf.Agents == nil {
		sf.Agents = make(map[string]Agent)
	}
	return sf
}

// SortedAgents returns agents sorted by state priority, then by updated_at.
func SortedAgents(sf StateFile) []Agent {
	agents := make([]Agent, 0, len(sf.Agents))
	for _, a := range sf.Agents {
		if a.Target == "" || a.State == "" {
			continue
		}
		if ValidateTarget(a.Target) != nil {
			continue
		}
		agents = append(agents, a)
	}

	sort.Slice(agents, func(i, j int) bool {
		pi := statePriority[agents[i].State]
		pj := statePriority[agents[j].State]
		if pi == 0 {
			pi = 99
		}
		if pj == 0 {
			pj = 99
		}
		if pi != pj {
			return pi < pj
		}
		return agents[i].UpdatedAt < agents[j].UpdatedAt
	})

	return agents
}

// FormatDuration returns a human-readable duration since the given ISO8601 timestamp.
func FormatDuration(iso string) string {
	if iso == "" {
		return ""
	}
	t, err := time.Parse(time.RFC3339, iso)
	if err != nil {
		return ""
	}
	d := time.Since(t)
	if d < 0 {
		return ""
	}

	secs := int(d.Seconds())
	if secs < 60 {
		return fmt.Sprintf("%ds", secs)
	}
	mins := secs / 60
	if mins < 60 {
		return fmt.Sprintf("%dm %ds", mins, secs%60)
	}
	hours := mins / 60
	return fmt.Sprintf("%dh %dm", hours, mins%60)
}
