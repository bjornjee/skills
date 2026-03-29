package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReadState_MissingFile(t *testing.T) {
	sf := ReadState("/nonexistent/path.json")
	if len(sf.Agents) != 0 {
		t.Errorf("expected empty agents, got %d", len(sf.Agents))
	}
}

func TestReadState_InvalidJSON(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "state.json")
	os.WriteFile(path, []byte("not json{{{"), 0644)

	sf := ReadState(path)
	if len(sf.Agents) != 0 {
		t.Errorf("expected empty agents for invalid JSON, got %d", len(sf.Agents))
	}
}

func TestReadState_ValidState(t *testing.T) {
	tmp := t.TempDir()
	path := filepath.Join(tmp, "state.json")
	os.WriteFile(path, []byte(`{
		"agents": {
			"a:0.1": {"target":"a:0.1","state":"running","session":"a"},
			"b:1.0": {"target":"b:1.0","state":"input","session":"b"}
		}
	}`), 0644)

	sf := ReadState(path)
	if len(sf.Agents) != 2 {
		t.Fatalf("expected 2 agents, got %d", len(sf.Agents))
	}
	if sf.Agents["a:0.1"].State != "running" {
		t.Errorf("expected running, got %s", sf.Agents["a:0.1"].State)
	}
}

func TestSortedAgents_Priority(t *testing.T) {
	sf := StateFile{
		Agents: map[string]Agent{
			"a:3.0": {Target: "a:3.0", State: "done", Window: 3, Pane: 0},
			"a:1.0": {Target: "a:1.0", State: "input", Window: 1, Pane: 0},
			"a:2.0": {Target: "a:2.0", State: "running", Window: 2, Pane: 0},
			"a:0.0": {Target: "a:0.0", State: "error", Window: 0, Pane: 0},
			"a:4.0": {Target: "a:4.0", State: "idle", Window: 4, Pane: 0},
		},
	}

	sorted := SortedAgents(sf, "")

	// Group 1: needs attention (input, error) sorted by window
	// Group 2: running
	// Group 3: completed (idle, done) sorted by window
	expected := []string{"error", "input", "running", "done", "idle"}

	if len(sorted) != 5 {
		t.Fatalf("expected 5 agents, got %d", len(sorted))
	}
	for i, want := range expected {
		if sorted[i].State != want {
			t.Errorf("position %d: expected %s, got %s", i, want, sorted[i].State)
		}
	}
}

func TestSortedAgents_SkipsInvalid(t *testing.T) {
	sf := StateFile{
		Agents: map[string]Agent{
			"good": {Target: "good", State: "running"},
			"bad1": {Target: "", State: "running"},
			"bad2": {Target: "bad2", State: ""},
		},
	}

	sorted := SortedAgents(sf, "")
	if len(sorted) != 1 {
		t.Errorf("expected 1 valid agent, got %d", len(sorted))
	}
}

func TestFormatDuration(t *testing.T) {
	if FormatDuration("") != "" {
		t.Error("expected empty for empty input")
	}
	if FormatDuration("not a date") != "" {
		t.Error("expected empty for invalid date")
	}
	// Can't easily test specific durations without mocking time,
	// but we can verify it doesn't panic on valid input
	result := FormatDuration("2020-01-01T00:00:00Z")
	if result == "" {
		t.Error("expected non-empty for valid old date")
	}
}
