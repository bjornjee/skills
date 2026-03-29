package main

import "testing"

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
