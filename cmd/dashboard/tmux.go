package main

import (
	"context"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

const tmuxTimeout = 2 * time.Second

// validTarget matches tmux targets: session:window.pane where components are alphanumeric, dash, underscore, or dot.
var validTarget = regexp.MustCompile(`^[a-zA-Z0-9_.\-]+(:[0-9]+(\.[0-9]+)?)?$`)

// ansiEscape matches ANSI escape sequences (CSI, OSC, etc.)
var ansiEscape = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x1b]*\x1b\\|\x1b\][^\x07]*\x07|\x1b[^[\]].?`)

// ValidateTarget checks that a target string is a safe tmux target identifier.
func ValidateTarget(target string) error {
	if !validTarget.MatchString(target) {
		return fmt.Errorf("invalid tmux target: %q", target)
	}
	return nil
}

// TmuxIsAvailable checks if tmux is running.
func TmuxIsAvailable() bool {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()
	return exec.CommandContext(ctx, "tmux", "list-sessions").Run() == nil
}

// TmuxCapture captures the last N lines from a tmux pane.
func TmuxCapture(target string, lines int) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()

	out, err := exec.CommandContext(ctx, "tmux",
		"capture-pane", "-p", "-t", target, "-S", fmt.Sprintf("-%d", lines),
	).Output()
	if err != nil {
		return nil, fmt.Errorf("capture-pane failed for %s: %w", target, err)
	}

	cleaned := ansiEscape.ReplaceAllString(string(out), "")
	cleaned = strings.ReplaceAll(cleaned, "\r", "")
	return strings.Split(cleaned, "\n"), nil
}

// TmuxJump switches to the tmux window and pane of the given target.
func TmuxJump(target string) error {
	sw := extractSessionWindow(target)

	ctx1, cancel1 := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel1()
	if err := exec.CommandContext(ctx1, "tmux", "select-window", "-t", sw).Run(); err != nil {
		return fmt.Errorf("select-window failed for %s: %w", sw, err)
	}

	ctx2, cancel2 := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel2()
	if err := exec.CommandContext(ctx2, "tmux", "select-pane", "-t", target).Run(); err != nil {
		return fmt.Errorf("select-pane failed for %s: %w", target, err)
	}

	return nil
}

// TmuxSendKeys sends keystrokes to a tmux pane, followed by Enter.
func TmuxSendKeys(target, text string) error {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()
	return exec.CommandContext(ctx, "tmux", "send-keys", "-t", target, text, "Enter").Run()
}

// TmuxSendRaw sends a single key to a tmux pane without Enter.
func TmuxSendRaw(target, key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()
	return exec.CommandContext(ctx, "tmux", "send-keys", "-t", target, key).Run()
}

// TmuxListPanes returns the set of all live tmux pane targets (session:window.pane).
func TmuxListPanes() map[string]bool {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()

	out, err := exec.CommandContext(ctx, "tmux", "list-panes", "-a",
		"-F", "#{session_name}:#{window_index}.#{pane_index}").Output()
	if err != nil {
		return nil
	}

	panes := make(map[string]bool)
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line != "" {
			panes[line] = true
		}
	}
	return panes
}

// extractSessionWindow returns session:window from session:window.pane.
func extractSessionWindow(target string) string {
	lastDot := strings.LastIndex(target, ".")
	if lastDot == -1 {
		return target
	}
	return target[:lastDot]
}
