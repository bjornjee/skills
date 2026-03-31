#!/usr/bin/env node
/**
 * Fast state sync hook for agent dashboard.
 *
 * Registered for PreToolUse, PostToolUse, and PermissionRequest.
 * Updates only: state, permission_mode, current_tool, last_hook_event.
 * Skips: git branch, git diff, tmux capture, session_id lookup, model, preview.
 *
 * Uses per-agent files keyed by session_id — no locking needed.
 *
 * Stdin: JSON from Claude Code hook system
 * Env: TMUX_PANE, CLAUDE_PLUGIN_ROOT
 */

'use strict';

const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
const { readAgentState, writeState } = require(path.join(pluginRoot, 'packages', 'agent-state'));
const { getTarget } = require(path.join(pluginRoot, 'packages', 'tmux'));
const { getBranch, extractCwdFromCommand } = require(path.join(pluginRoot, 'packages', 'git-status'));

/**
 * Whether to refresh the git branch on this hook event.
 * Only PostToolUse + Bash can change branches (~10ms cost).
 * @param {string} hookEvent
 * @param {string} toolName
 * @returns {boolean}
 */
function shouldRefreshBranch(hookEvent, toolName) {
  return hookEvent === 'PostToolUse' && toolName === 'Bash';
}

/**
 * Determine the agent state from the hook event.
 * @param {string} hookEvent - hook_event_name from stdin
 * @param {string} toolName - tool_name from stdin
 * @returns {string} "input" or "running"
 */
function resolveState(hookEvent, toolName) {
  if (hookEvent === 'PermissionRequest') {
    return 'input';
  }
  // AskUserQuestion fires as PreToolUse, not PermissionRequest.
  // It always blocks for user input, so treat it like a permission prompt.
  if (hookEvent === 'PreToolUse' && toolName === 'AskUserQuestion') {
    return 'input';
  }
  return 'running';
}

const MAX_STDIN = 1024 * 64; // 64KB
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});

process.stdin.on('end', () => {
  try {
    const input = data.trim() ? JSON.parse(data) : {};
    fastUpdate(input);
  } catch {
    // Silent — don't break Claude Code
  }
});

/**
 * Build the state update object from hook input and existing state.
 * Pure logic — no I/O. Returns { changed, update } where update is the
 * fields to merge, or null if nothing changed.
 *
 * @param {object} params
 * @param {object} params.input - parsed hook stdin
 * @param {object} params.existing - current agent state from disk
 * @param {string} params.target - tmux target string
 * @param {string} params.tmuxPane - TMUX_PANE env value
 * @param {string|undefined} params.branch - refreshed branch (only when shouldRefreshBranch)
 * @param {string|null} params.effectiveCwd - cwd extracted from Bash cd command (only when shouldRefreshBranch)
 * @returns {{ changed: boolean, update: object|null }}
 */
function buildUpdate({ input, existing, target, tmuxPane, branch, effectiveCwd }) {
  const hookEvent = input.hook_event_name;
  const toolName = input.tool_name || '';
  const permissionMode = input.permission_mode || '';

  const state = resolveState(hookEvent, toolName);
  const currentTool = hookEvent === 'PostToolUse' ? '' : toolName;

  const refreshBranch = shouldRefreshBranch(hookEvent, toolName);

  const changed = existing.state !== state
    || existing.current_tool !== currentTool
    || existing.permission_mode !== permissionMode
    || (refreshBranch && existing.branch !== branch)
    || (refreshBranch && effectiveCwd && existing.cwd !== effectiveCwd);

  if (!changed && existing.state) {
    return { changed: false, update: null };
  }

  const update = {
    target,
    tmux_pane_id: tmuxPane,
    session_id: input.session_id,
    state,
    current_tool: currentTool,
    permission_mode: permissionMode || existing.permission_mode || '',
    last_hook_event: hookEvent || '',
  };
  if (refreshBranch) {
    update.branch = branch;
    if (effectiveCwd) {
      update.cwd = effectiveCwd;
    }
  }
  return { changed: true, update };
}

function fastUpdate(input) {
  const tmuxPane = process.env.TMUX_PANE;
  if (!tmuxPane) return;

  const sessionId = input.session_id;
  if (!sessionId) return; // Can't write without a session_id key

  const target = getTarget(tmuxPane);
  if (!target) return;

  const existing = readAgentState(sessionId) || {};

  // Refresh branch after Bash (only tool that can change branches, ~10ms).
  const refreshBranch = shouldRefreshBranch(input.hook_event_name, input.tool_name || '');
  let branch;
  let effectiveCwd = null;
  if (refreshBranch) {
    const toolInput = input.tool_input || {};
    const detectedCwd = extractCwdFromCommand(toolInput.command);
    if (detectedCwd) {
      // Agent cd'd to a new directory — refresh branch from there
      effectiveCwd = detectedCwd;
      branch = getBranch(detectedCwd) || existing.branch || '';
    } else {
      // No cd detected — preserve existing branch and cwd
      branch = existing.branch || '';
    }
  }

  const { changed, update } = buildUpdate({ input, existing, target, tmuxPane, branch, effectiveCwd });
  if (changed && update) {
    writeState(sessionId, update);
  }
}

// Export for testing
module.exports = { resolveState, shouldRefreshBranch, buildUpdate };
