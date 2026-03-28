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

	return strings.Split(string(out), "\n"), nil
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

// TmuxSendKeys sends keystrokes to a tmux pane.
func TmuxSendKeys(target, text string) error {
	ctx, cancel := context.WithTimeout(context.Background(), tmuxTimeout)
	defer cancel()
	return exec.CommandContext(ctx, "tmux", "send-keys", "-t", target, text, "Enter").Run()
}

// extractSessionWindow returns session:window from session:window.pane.
func extractSessionWindow(target string) string {
	lastDot := strings.LastIndex(target, ".")
	if lastDot == -1 {
		return target
	}
	return target[:lastDot]
}
