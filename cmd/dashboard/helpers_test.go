package main

import (
	"strings"
	"testing"

	"github.com/charmbracelet/lipgloss"
)

func TestRepoFromCwd(t *testing.T) {
	tests := []struct {
		name string
		cwd  string
		want string
	}{
		{
			name: "worktree path",
			cwd:  "/Users/bjornjee/Code/bjornjee/worktrees/skills/dashboard-agent-naming",
			want: "skills",
		},
		{
			name: "normal repo path",
			cwd:  "/Users/bjornjee/Code/bjornjee/skills",
			want: "skills",
		},
		{
			name: "worktree with deep path",
			cwd:  "/home/user/worktrees/myapp/feature-branch",
			want: "myapp",
		},
		{
			name: "empty cwd",
			cwd:  "",
			want: "",
		},
		{
			name: "root path",
			cwd:  "/",
			want: "",
		},
		{
			name: "worktrees at end without branch dir",
			cwd:  "/home/user/worktrees/repo",
			want: "repo",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := repoFromCwd(tt.cwd)
			if got != tt.want {
				t.Errorf("repoFromCwd(%q) = %q, want %q", tt.cwd, got, tt.want)
			}
		})
	}
}

func TestAgentLabel(t *testing.T) {
	tests := []struct {
		name  string
		agent Agent
		want  string
	}{
		{
			name: "repo and branch",
			agent: Agent{
				Cwd:    "/Users/bjornjee/Code/bjornjee/skills",
				Branch: "feat/dashboard-agent-naming",
			},
			want: "skills/feat/dashboard-agent-naming",
		},
		{
			name: "worktree repo and branch",
			agent: Agent{
				Cwd:    "/Users/bjornjee/Code/bjornjee/worktrees/skills/dashboard-agent-naming",
				Branch: "feat/dashboard-agent-naming",
			},
			want: "skills/feat/dashboard-agent-naming",
		},
		{
			name: "repo only no branch",
			agent: Agent{
				Cwd: "/Users/bjornjee/Code/bjornjee/skills",
			},
			want: "skills",
		},
		{
			name: "branch only no cwd",
			agent: Agent{
				Branch: "main",
			},
			want: "main",
		},
		{
			name: "fallback to session",
			agent: Agent{
				Session: "dev",
			},
			want: "dev",
		},
		{
			name: "empty agent",
			agent: Agent{},
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := agentLabel(tt.agent)
			if got != tt.want {
				t.Errorf("agentLabel() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestPermissionModeColor(t *testing.T) {
	tests := []struct {
		name string
		mode string
		want lipgloss.Color
	}{
		{"plan mode gets blue/purple", "plan", lipgloss.Color("105")},
		{"auto-edit gets yellow", "auto-edit", lipgloss.Color("220")},
		{"autoEdit gets yellow", "autoEdit", lipgloss.Color("220")},
		{"full-auto gets green", "full-auto", lipgloss.Color("82")},
		{"fullAuto gets green", "fullAuto", lipgloss.Color("82")},
		{"unknown mode gets gray", "custom", lipgloss.Color("242")},
		{"case insensitive Plan", "Plan", lipgloss.Color("105")},
		{"default fallback", "default", lipgloss.Color("242")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := permissionModeColor(tt.mode)
			if got != tt.want {
				t.Errorf("permissionModeColor(%q) = %q, want %q", tt.mode, got, tt.want)
			}
		})
	}
}

func TestPermissionModeStyle(t *testing.T) {
	// permissionModeStyle should preserve the original mode text in its output
	modes := []string{"plan", "auto-edit", "full-auto", "custom"}
	for _, mode := range modes {
		t.Run(mode, func(t *testing.T) {
			got := permissionModeStyle(mode)
			if !strings.Contains(got, mode) {
				t.Errorf("permissionModeStyle(%q) = %q, want text %q present", mode, got, mode)
			}
		})
	}
}
