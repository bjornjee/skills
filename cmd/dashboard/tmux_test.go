package main

import (
	"testing"
)

func TestValidateTarget(t *testing.T) {
	valid := []string{
		"main:0.1",
		"myproject:0.1",
		"dev:12.3",
		"session:0",
		"a-b_c:1.0",
	}
	for _, target := range valid {
		if err := ValidateTarget(target); err != nil {
			t.Errorf("ValidateTarget(%q) = %v, want nil", target, err)
		}
	}

	invalid := []string{
		"",
		"session; rm -rf ~",
		"{last}",
		"foo bar:0.1",
		"$(whoami):0.1",
		"session:window.pane",
	}
	for _, target := range invalid {
		if err := ValidateTarget(target); err == nil {
			t.Errorf("ValidateTarget(%q) = nil, want error", target)
		}
	}
}

func TestExtractSessionWindow(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"main:0.1", "main:0"},
		{"my.project:0.1", "my.project:0"},
		{"127.0.0.1:0.1", "127.0.0.1:0"},
		{"main:0", "main:0"},
		{"dev:12.3", "dev:12"},
	}

	for _, tt := range tests {
		got := extractSessionWindow(tt.input)
		if got != tt.want {
			t.Errorf("extractSessionWindow(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
