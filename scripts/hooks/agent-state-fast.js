#!/usr/bin/env node
/**
 * Fast state sync hook for agent dashboard.
 *
 * Registered for PreToolUse, PostToolUse, and PermissionRequest.
 * Updates only: state, permission_mode, current_tool, last_hook_event.
 * Skips: git branch, git diff, tmux capture, session_id lookup, model, preview.
 *
 * Stdin: JSON from Claude Code hook system
 * Env: TMUX_PANE, CLAUDE_PLUGIN_ROOT
 */

'use strict';

const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
const { readState, writeState } = require(path.join(pluginRoot, 'packages', 'agent-state'));
const { getTarget } = require(path.join(pluginRoot, 'packages', 'tmux'));
const { getBranch } = require(path.join(pluginRoot, 'packages', 'git-status'));

/**
 * Whether to refresh the git branch on this hook event.
 * Only PostToolUse + Bash can change branches (~10ms cost).
 * Assumes only the built-in Bash tool can change branches.
 * Custom shell-executing MCP tools are not covered here.
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

const MAX_STDIN = 1024 * 64; // 64KB — smaller than full reporter, we only need a few fields
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

function fastUpdate(input) {
  const tmuxPane = process.env.TMUX_PANE;
  if (!tmuxPane) return;

  const target = getTarget(tmuxPane);
  if (!target) return;

  const hookEvent = input.hook_event_name;
  const toolName = input.tool_name || '';
  const permissionMode = input.permission_mode || '';

  const state = resolveState(hookEvent, toolName);
  const currentTool = hookEvent === 'PostToolUse' ? '' : toolName;

  const existing = readState().agents[target] || {};

  // Refresh branch after Bash (only tool that can change branches, ~10ms).
  // Always write the result (even '') to clear stale values on detached HEAD.
  const refreshBranch = shouldRefreshBranch(hookEvent, toolName);
  let branch;
  if (refreshBranch) {
    const cwd = input.cwd || process.cwd();
    branch = getBranch(cwd) || '';
  }

  // NOTE: read-modify-write race is possible when multiple async hooks fire
  // concurrently. Acceptable for display-only fields (current_tool, state).
  // Only update the fast-path fields, preserve everything else
  const changed = existing.state !== state
    || existing.current_tool !== currentTool
    || existing.permission_mode !== permissionMode
    || (refreshBranch && existing.branch !== branch);

  if (changed || !existing.state) {
    const update = {
      state,
      current_tool: currentTool,
      permission_mode: permissionMode || existing.permission_mode || '',
      last_hook_event: hookEvent || '',
    };
    if (refreshBranch) {
      update.branch = branch;
    }
    writeState(target, update);
  }
}

// Export for testing
module.exports = { resolveState, shouldRefreshBranch };
