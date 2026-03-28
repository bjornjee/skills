#!/usr/bin/env node
/**
 * Agent state reporter hook.
 *
 * Writes agent state to ~/.claude/agent-dashboard/state.json on every
 * Stop, PreToolUse, and PostToolUse event. Uses packages/agent-state,
 * packages/tmux, and packages/git-status for core logic.
 *
 * Stdin: JSON from Claude Code hook system
 * Env: TMUX_PANE, CLAUDE_PLUGIN_ROOT
 */

'use strict';

const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
const { readState, writeState, detectState } = require(path.join(pluginRoot, 'packages', 'agent-state'));
const { getTarget, capture, parseTarget } = require(path.join(pluginRoot, 'packages', 'tmux'));
const { getChangedFiles, getBranch } = require(path.join(pluginRoot, 'packages', 'git-status'));

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

  const cwd = input.cwd || process.cwd();
  const hookEvent = input.hook_event_name;
  const lastMessage = input.last_assistant_message || null;

  // PreToolUse → agent is actively working
  // Stop → detect whether waiting for input or done
  let state;
  if (hookEvent === 'PreToolUse' || hookEvent === 'PostToolUse') {
    state = 'running';
  } else {
    const paneBuffer = capture(target, 15);
    state = detectState(lastMessage, paneBuffer);
  }

  const { session, window, pane } = parseTarget(target);
  const branch = getBranch(cwd);
  const filesChanged = getChangedFiles(cwd);

  const preview = lastMessage
    ? lastMessage.split('\n').filter(l => l.trim()).slice(-3).join(' ').substring(0, 200)
    : null;

  // Preserve started_at if already set, otherwise initialize
  const existing = readState().agents[target] || {};

  writeState(target, {
    target,
    session,
    window,
    pane,
    state,
    cwd,
    branch,
    files_changed: filesChanged,
    last_message_preview: preview,
    started_at: existing.started_at || new Date().toISOString(),
  });
}
