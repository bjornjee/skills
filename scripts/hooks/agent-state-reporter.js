#!/usr/bin/env node
/**
 * Agent state reporter hook.
 *
 * Writes agent state on lifecycle events (SessionStart, SubagentStart/Stop, Stop).
 * Uses per-agent files keyed by session_id — no locking needed.
 *
 * Stdin: JSON from Claude Code hook system
 * Env: TMUX_PANE, CLAUDE_PLUGIN_ROOT
 */

'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
const { readAgentState, writeState, detectState } = require(path.join(pluginRoot, 'packages', 'agent-state'));
const { getTarget, capture, parseTarget } = require(path.join(pluginRoot, 'packages', 'tmux'));
const { getChangedFiles, getBranch } = require(path.join(pluginRoot, 'packages', 'git-status'));

function findSessionId() {
  const sessDir = path.join(os.homedir(), '.claude', 'sessions');
  // Walk up PID tree: hook → (possible sh) → claude
  let pid = process.ppid;
  for (let i = 0; i < 3 && pid > 1; i++) {
    try {
      const file = path.join(sessDir, `${pid}.json`);
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data.sessionId) return data.sessionId;
    } catch { /* not found, try parent */ }
    try {
      const { spawnSync } = require('child_process');
      const r = spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], { timeout: 1000 });
      pid = parseInt(r.stdout.toString().trim(), 10);
      if (isNaN(pid)) break;
    } catch { break; }
  }
  return null;
}

const MAX_STDIN = 1024 * 1024;
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});

process.stdin.on('end', () => {
  try {
    const input = data.trim() ? JSON.parse(data) : {};
    report(input);
  } catch {
    // Silent — don't break Claude Code
  }
});

function report(input) {
  const tmuxPane = process.env.TMUX_PANE;
  if (!tmuxPane) return;

  const target = getTarget(tmuxPane);
  if (!target) return;

  // Resolve session_id: from input, existing state, or PID-based lookup
  const sessionId = input.session_id
    || (readAgentState(input.session_id) || {}).session_id
    || findSessionId();
  if (!sessionId) return; // Can't write without a key

  const existing = readAgentState(sessionId) || {};

  const cwd = input.cwd || process.cwd();
  const hookEvent = input.hook_event_name;
  const lastMessage = input.last_assistant_message || null;

  // Determine agent state based on hook event.
  // PreToolUse/PostToolUse/PermissionRequest are handled by agent-state-fast.js.
  let state;
  if (hookEvent === 'SessionStart' || hookEvent === 'SubagentStart' || hookEvent === 'SubagentStop') {
    state = 'running';
  } else {
    // Stop event — detect from pane buffer + last message
    const paneBuffer = capture(target, 15);
    state = detectState(lastMessage, paneBuffer);
  }

  const { session, window, pane } = parseTarget(target);
  const filesChanged = getChangedFiles(cwd);

  // Branch is owned by agent-state-fast.js. Only set on SessionStart (initial value).
  // Note: SessionStart cwd is the Claude session's primary directory, not the worktree.
  // The fast hook corrects this on the first PostToolUse+Bash with a cd to the worktree.
  const branch = hookEvent === 'SessionStart' ? getBranch(cwd) : undefined;

  const preview = lastMessage
    ? lastMessage.split('\n').filter(l => l.trim()).slice(-3).join(' ').substring(0, 200)
    : null;

  // Model: capture on SessionStart, preserve otherwise
  const model = (hookEvent === 'SessionStart' && input.model)
    ? input.model
    : (existing.model || '');

  // Permission mode: always update from hook input
  const permissionMode = input.permission_mode || existing.permission_mode || '';

  // Subagent count: increment on start, decrement on stop
  let subagentCount = existing.subagent_count || 0;
  if (hookEvent === 'SubagentStart') {
    subagentCount++;
  } else if (hookEvent === 'SubagentStop') {
    subagentCount = Math.max(0, subagentCount - 1);
  }

  const entry = {
    target,
    tmux_pane_id: tmuxPane,
    session,
    window,
    pane,
    state,
    cwd,
    files_changed: filesChanged,
    last_message_preview: preview,
    session_id: sessionId,
    started_at: existing.started_at || new Date().toISOString(),
    model,
    permission_mode: permissionMode,
    subagent_count: subagentCount,
    last_hook_event: hookEvent || '',
  };

  // Branch is owned by agent-state-fast.js; only set initial value on SessionStart
  if (branch !== undefined) {
    entry.branch = branch;
  }

  // Debounce: skip write if nothing meaningful changed
  const changed = existing.state !== state
    || (branch !== undefined && existing.branch !== branch)
    || existing.subagent_count !== subagentCount
    || existing.last_message_preview !== preview
    || existing.permission_mode !== permissionMode
    || (existing.files_changed || []).join() !== filesChanged.join();

  if (changed || !existing.state) {
    writeState(sessionId, entry);
  }
}
