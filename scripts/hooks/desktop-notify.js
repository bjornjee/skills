#!/usr/bin/env node
/**
 * Desktop notification hook (Stop event).
 *
 * Sends a macOS notification via terminal-notifier when Claude finishes
 * responding. When running inside tmux, clicking the notification switches
 * to the correct window and pane.
 *
 * Fallback: osascript if terminal-notifier is not installed.
 *
 * Env vars:
 *   CLAUDE_NOTIFY_SOUND - notification sound name (default: "default", set to "" to disable)
 *
 * Dependencies (optional): terminal-notifier (brew install terminal-notifier)
 */

'use strict';

const { spawnSync } = require('child_process');
const { basename, resolve } = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || resolve(__dirname, '..', '..');
const tmuxPkg = require(resolve(pluginRoot, 'packages', 'tmux'));
const { detectState } = require(resolve(pluginRoot, 'packages', 'agent-state', 'detect'));

const TITLE = 'Claude Code';
const MAX_BODY = 100;

// Plan review — requires 'input' state (plan approval UI shows ❯ prompt)
const PLAN_PATTERNS = [
  /\bplan\b.*\b(review|approve|approval)\b/i,
  /\breview\b.*\bplan\b/i,
  /\bplease\s+(review|approve)\b/i,
  /\bimplementation\s+plan\b/i,
  /\bplan\s+is\s+ready\b/i,
];

// Feature completion — allows 'input' or 'done' (declarative, not questions)
const COMPLETION_PATTERNS = [
  /\b(feature|implementation|work)\s+(is\s+)?(complete|done|finished)\b/i,
  /\bsuccessfully\s+(implemented|completed|finished)\b/i,
  /\ball\s+(changes|tests)\b.*\b(pass|complete|implemented)\b/i,
  /\bready\s+for\s+(your\s+)?(review|input)\b/i,
];

const NOTIFICATION_PATTERNS = [...PLAN_PATTERNS, ...COMPLETION_PATTERNS];

/**
 * Determine whether a notification should fire.
 * Plan review: requires 'input' state (plan approval UI shows prompt).
 * Completion: allows 'input' or 'done' (declarative statements, not questions).
 *
 * @param {'input'|'done'|'running'} state - Agent state from detectState()
 * @param {string|null} message - The last assistant message
 * @returns {boolean}
 */
function shouldNotify(state, message) {
  if (state !== 'input' && state !== 'done') return false;
  if (!message || typeof message !== 'string') return false;

  if (state === 'input') {
    return NOTIFICATION_PATTERNS.some(p => p.test(message));
  }

  // state === 'done': only completion patterns fire
  return COMPLETION_PATTERNS.some(p => p.test(message));
}

function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/```[\s\S]*?```/g, '')    // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '')        // list markers
    .trim();
}

function extractSummary(message) {
  if (!message || typeof message !== 'string') return 'Done';

  const cleaned = stripMarkdown(message);
  const line = cleaned
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 0);

  if (!line) return 'Done';
  return line.length > MAX_BODY ? `${line.slice(0, MAX_BODY)}...` : line;
}

function getSubtitle(cwd) {
  const parts = [];

  if (cwd) {
    parts.push(basename(cwd));
  }

  const branch = spawnSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
    timeout: 2000,
    cwd: cwd || undefined,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (branch.status === 0 && branch.stdout.trim()) {
    parts.push(branch.stdout.trim());
  }

  return parts.join(' | ') || undefined;
}

function hasCommand(cmd) {
  const result = spawnSync('which', [cmd], { stdio: 'ignore', timeout: 2000 });
  return result.status === 0;
}

function sanitizeShellArg(str) {
  return str.replace(/[^a-zA-Z0-9_.:@/-]/g, '');
}

function getTmuxAction() {
  const tmuxPane = process.env.TMUX_PANE;
  if (!tmuxPane) return undefined;

  const target = spawnSync('tmux', [
    'display-message', '-t', tmuxPane, '-p',
    '#{session_name}:#{window_index}.#{pane_index}',
  ], { encoding: 'utf8', timeout: 2000 });

  if (!target.stdout) return undefined;

  const t = sanitizeShellArg(target.stdout.trim());
  const sessionWindow = tmuxPkg.extractSessionWindow(t);
  return `tmux select-window -t '${sessionWindow}' && tmux select-pane -t '${t}'`;
}

function notifyWithTerminalNotifier(title, subtitle, body, sound) {
  const args = ['-title', title, '-message', body, '-group', `claude-${process.pid}`];

  if (subtitle) args.push('-subtitle', subtitle);
  if (sound) args.push('-sound', sound);

  const action = getTmuxAction();
  if (action) args.push('-execute', action);

  spawnSync('terminal-notifier', args, { stdio: 'ignore', timeout: 5000 });
}

function escapeAppleScript(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function notifyWithOsascript(title, subtitle, body, sound) {
  const subtitlePart = subtitle ? ` subtitle "${escapeAppleScript(subtitle)}"` : '';
  const soundPart = sound ? ` sound name "${escapeAppleScript(sound)}"` : '';
  const script = `display notification "${escapeAppleScript(body)}" with title "${escapeAppleScript(title)}"${subtitlePart}${soundPart}`;

  spawnSync('osascript', ['-e', script], { stdio: 'ignore', timeout: 5000 });
}

function notify(title, subtitle, body) {
  if (process.platform !== 'darwin') return;

  const soundEnv = process.env.CLAUDE_NOTIFY_SOUND;
  const sound = soundEnv === undefined ? 'default' : soundEnv || undefined;

  if (hasCommand('terminal-notifier')) {
    notifyWithTerminalNotifier(title, subtitle, body, sound);
  } else {
    notifyWithOsascript(title, subtitle, body, sound);
  }
}

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = { stripMarkdown, extractSummary, escapeAppleScript, sanitizeShellArg, shouldNotify, PLAN_PATTERNS, COMPLETION_PATTERNS, NOTIFICATION_PATTERNS };
}

// Only run stdin reader when executed directly (not when require()'d by tests)
if (require.main === module) {
  const MAX_STDIN = 1024 * 1024;
  let data = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
  });
  process.stdin.on('end', () => {
    try {
      const input = data.trim() ? JSON.parse(data) : {};
      const message = input.last_assistant_message;

      // Detect agent state from message content + tmux pane buffer
      const tmuxPane = process.env.TMUX_PANE;
      const paneTarget = tmuxPane ? tmuxPkg.getTarget(tmuxPane) : null;
      const paneBuffer = paneTarget ? tmuxPkg.capture(paneTarget, 15) : [];
      const state = detectState(message, paneBuffer);

      if (!shouldNotify(state, message)) return;

      const body = extractSummary(message);
      const subtitle = getSubtitle(input.cwd);
      notify(TITLE, subtitle, body);
    } catch {
      // Silent — don't break Claude Code if notification fails
    }
  });
}
