package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	statePath := DefaultStatePath()

	m := newModel(statePath)
	p := tea.NewProgram(m, tea.WithAltScreen())

	// Start file watcher
	watcher, err := watchStateFile(statePath, p)
	if err != nil {
		// Non-fatal: dashboard works without live updates
		fmt.Fprintf(os.Stderr, "warning: file watcher not available: %v\n", err)
	}
	if watcher != nil {
		defer watcher.Close()
	}

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
