package main

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

// ConversationEntry represents a single turn in the conversation.
type ConversationEntry struct {
	Role      string // "human" or "assistant"
	Content   string
	Timestamp string
}

// ProjectSlug derives the Claude Code project slug from a cwd path.
// e.g., "/Users/bjornjee/Code/skills" → "-Users-bjornjee-Code-skills"
func ProjectSlug(cwd string) string {
	return strings.ReplaceAll(cwd, string(os.PathSeparator), "-")
}

// jsonlEntry is the raw structure of a Claude Code session JSONL line.
type jsonlEntry struct {
	Type      string          `json:"type"`
	Message   json.RawMessage `json:"message"`
	Timestamp string          `json:"timestamp"`
}

type messageEnvelope struct {
	Role    string          `json:"role"`
	Content json.RawMessage `json:"content"`
}

type contentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// ReadConversation reads the Claude Code session JSONL and returns
// the last `limit` user/assistant text entries.
// projDir is the full path to the project directory under ~/.claude/projects/.
func ReadConversation(projDir, sessionID string, limit int) []ConversationEntry {
	path := filepath.Join(projDir, sessionID+".jsonl")
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	var all []ConversationEntry
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 1024*1024), 10*1024*1024) // 10MB max line

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var entry jsonlEntry
		if err := json.Unmarshal(line, &entry); err != nil {
			continue
		}

		switch entry.Type {
		case "user":
			if e := parseUserEntry(entry); e != nil {
				all = append(all, *e)
			}
		case "assistant":
			if e := parseAssistantEntry(entry); e != nil {
				all = append(all, *e)
			}
		}
	}

	if limit > 0 && len(all) > limit {
		all = all[len(all)-limit:]
	}
	return all
}

func parseUserEntry(entry jsonlEntry) *ConversationEntry {
	var env messageEnvelope
	if err := json.Unmarshal(entry.Message, &env); err != nil {
		return nil
	}

	// User content can be a string or an array (tool_result).
	// Only show string content (actual user messages).
	var strContent string
	if err := json.Unmarshal(env.Content, &strContent); err != nil {
		return nil // array content (tool_result) — skip
	}

	strContent = strings.TrimSpace(strContent)
	if strContent == "" {
		return nil
	}

	return &ConversationEntry{
		Role:      "human",
		Content:   truncate(strContent, 500),
		Timestamp: entry.Timestamp,
	}
}

func parseAssistantEntry(entry jsonlEntry) *ConversationEntry {
	var env messageEnvelope
	if err := json.Unmarshal(entry.Message, &env); err != nil {
		return nil
	}

	// Assistant content is always an array of blocks.
	var blocks []contentBlock
	if err := json.Unmarshal(env.Content, &blocks); err != nil {
		return nil
	}

	// Extract only "text" blocks, skip "thinking" and "tool_use"
	var texts []string
	for _, b := range blocks {
		if b.Type == "text" && strings.TrimSpace(b.Text) != "" {
			texts = append(texts, strings.TrimSpace(b.Text))
		}
	}

	if len(texts) == 0 {
		return nil
	}

	content := strings.Join(texts, "\n")
	return &ConversationEntry{
		Role:      "assistant",
		Content:   truncate(content, 2000),
		Timestamp: entry.Timestamp,
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-1] + "…"
}

// ConversationsDir returns the Claude projects base directory.
func ConversationsDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "/tmp"
	}
	return filepath.Join(home, ".claude", "projects")
}

// sessionFile represents ~/.claude/sessions/{pid}.json
type sessionFile struct {
	PID       int    `json:"pid"`
	SessionID string `json:"sessionId"`
	Cwd       string `json:"cwd"`
	StartedAt int64  `json:"startedAt"`
}

// FindSessionID finds the most recent session ID for a given cwd
// by scanning ~/.claude/sessions/*.json. Used as fallback when
// session_id is not yet in the agent state.
func FindSessionID(cwd string) string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	sessDir := filepath.Join(home, ".claude", "sessions")
	entries, err := os.ReadDir(sessDir)
	if err != nil {
		return ""
	}

	var best sessionFile
	for _, e := range entries {
		if !strings.HasSuffix(e.Name(), ".json") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(sessDir, e.Name()))
		if err != nil {
			continue
		}
		var sf sessionFile
		if json.Unmarshal(data, &sf) != nil {
			continue
		}
		if sf.Cwd == cwd && sf.StartedAt > best.StartedAt {
			best = sf
		}
	}
	return best.SessionID
}
