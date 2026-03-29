package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestProjectSlug(t *testing.T) {
	tests := []struct {
		cwd  string
		want string
	}{
		{"/Users/bjornjee/Code/bjornjee/skills", "-Users-bjornjee-Code-bjornjee-skills"},
		{"/Users/bjornjee/Code/newb/ctf", "-Users-bjornjee-Code-newb-ctf"},
		{"/tmp/test", "-tmp-test"},
	}
	for _, tt := range tests {
		got := ProjectSlug(tt.cwd)
		if got != tt.want {
			t.Errorf("ProjectSlug(%q) = %q, want %q", tt.cwd, got, tt.want)
		}
	}
}

func TestReadConversation_MissingFile(t *testing.T) {
	entries := ReadConversation("/nonexistent", "no-such-id", 10)
	if len(entries) != 0 {
		t.Errorf("expected empty, got %d entries", len(entries))
	}
}

func TestReadConversation_ParsesEntries(t *testing.T) {
	dir := t.TempDir()
	slug := "test-project"
	sessionID := "abc-123"

	projDir := filepath.Join(dir, slug)
	os.MkdirAll(projDir, 0755)

	jsonl := `{"type":"user","message":{"role":"user","content":"fix the bug"},"timestamp":"2026-03-28T10:15:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"let me think..."},{"type":"text","text":"I fixed the bug by updating the handler."}]},"timestamp":"2026-03-28T10:15:30Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"Bash","input":{"command":"ls"}}]},"timestamp":"2026-03-28T10:15:35Z"}
{"type":"user","message":{"role":"user","content":"thanks!"},"timestamp":"2026-03-28T10:16:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"You're welcome!"}]},"timestamp":"2026-03-28T10:16:30Z"}
`
	os.WriteFile(filepath.Join(projDir, sessionID+".jsonl"), []byte(jsonl), 0644)

	entries := ReadConversation(filepath.Join(dir, slug), sessionID, 10)

	// Should have 4 entries: 2 user + 2 assistant text (skip tool_use-only entry)
	if len(entries) != 4 {
		t.Fatalf("expected 4 entries, got %d: %+v", len(entries), entries)
	}

	// First entry: user
	if entries[0].Role != "human" || entries[0].Content != "fix the bug" {
		t.Errorf("entry 0: got %+v", entries[0])
	}

	// Second entry: assistant (thinking stripped, only text)
	if entries[1].Role != "assistant" || entries[1].Content != "I fixed the bug by updating the handler." {
		t.Errorf("entry 1: got %+v", entries[1])
	}

	// Third: user
	if entries[2].Role != "human" || entries[2].Content != "thanks!" {
		t.Errorf("entry 2: got %+v", entries[2])
	}

	// Fourth: assistant
	if entries[3].Role != "assistant" || entries[3].Content != "You're welcome!" {
		t.Errorf("entry 3: got %+v", entries[3])
	}
}

func TestReadConversation_RespectsLimit(t *testing.T) {
	dir := t.TempDir()
	slug := "test-project"
	sessionID := "abc-123"

	projDir := filepath.Join(dir, slug)
	os.MkdirAll(projDir, 0755)

	jsonl := `{"type":"user","message":{"role":"user","content":"msg1"},"timestamp":"2026-03-28T10:00:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"reply1"}]},"timestamp":"2026-03-28T10:00:01Z"}
{"type":"user","message":{"role":"user","content":"msg2"},"timestamp":"2026-03-28T10:01:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"reply2"}]},"timestamp":"2026-03-28T10:01:01Z"}
{"type":"user","message":{"role":"user","content":"msg3"},"timestamp":"2026-03-28T10:02:00Z"}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"reply3"}]},"timestamp":"2026-03-28T10:02:01Z"}
`
	os.WriteFile(filepath.Join(projDir, sessionID+".jsonl"), []byte(jsonl), 0644)

	entries := ReadConversation(filepath.Join(dir, slug), sessionID, 2)
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	// Should be the LAST 2 entries
	if entries[0].Content != "msg3" {
		t.Errorf("expected msg3, got %s", entries[0].Content)
	}
	if entries[1].Content != "reply3" {
		t.Errorf("expected reply3, got %s", entries[1].Content)
	}
}

func TestReadConversation_HandlesUserContentArray(t *testing.T) {
	dir := t.TempDir()
	slug := "test-project"
	sessionID := "abc-123"

	projDir := filepath.Join(dir, slug)
	os.MkdirAll(projDir, 0755)

	// User messages with tool_result content (array format) should be skipped
	jsonl := `{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":[{"type":"text","text":"tool output"}]}]},"timestamp":"2026-03-28T10:15:00Z"}
{"type":"user","message":{"role":"user","content":"actual user message"},"timestamp":"2026-03-28T10:16:00Z"}
`
	os.WriteFile(filepath.Join(projDir, sessionID+".jsonl"), []byte(jsonl), 0644)

	entries := ReadConversation(filepath.Join(dir, slug), sessionID, 10)
	// Only the string-content user message should appear
	if len(entries) != 1 {
		t.Fatalf("expected 1 entry, got %d: %+v", len(entries), entries)
	}
	if entries[0].Content != "actual user message" {
		t.Errorf("expected 'actual user message', got %q", entries[0].Content)
	}
}

func TestReadConversation_SkipsMalformedLines(t *testing.T) {
	dir := t.TempDir()
	slug := "test-project"
	sessionID := "abc-123"

	projDir := filepath.Join(dir, slug)
	os.MkdirAll(projDir, 0755)

	jsonl := `not json at all
{"type":"user","message":{"role":"user","content":"valid"},"timestamp":"2026-03-28T10:15:00Z"}
{"broken json
`
	os.WriteFile(filepath.Join(projDir, sessionID+".jsonl"), []byte(jsonl), 0644)

	entries := ReadConversation(filepath.Join(dir, slug), sessionID, 10)
	if len(entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(entries))
	}
}
