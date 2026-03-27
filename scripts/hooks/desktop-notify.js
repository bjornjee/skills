#!/usr/bin/env node
/**
 * Desktop notification hook (Stop event).
 *
 * Sends a macOS notification via terminal-notifier when Claude finishes
 * responding. When running inside tmux, clicking the notification switches
 * to the correct window and pane.
 *
 * Dependencies: terminal-notifier (brew install terminal-notifier)
 */

'use strict';

const { spawnSync } = require('child_process');

const TITLE = 'Claude Code';
const MAX_BODY = 100;

function extractSummary(message) {
  if (!message || typeof message !== 'string') return 'Done';
  const line = message.split('\n').map(l => l.trim()).find(l => l.length > 0);
  if (!line) return 'Done';
  return line.length > MAX_BODY ? `${line.slice(0, MAX_BODY)}...` : line;
}

function notify(title, body) {
  if (process.platform !== 'darwin') return;

  const args = ['-title', title, '-message', body, '-group', `claude-${process.pid}`];

  const tmuxPane = process.env.TMUX_PANE;
  if (tmuxPane) {
    const target = spawnSync('tmux', [
      'display-message', '-t', tmuxPane, '-p',
      '#{session_name}:#{window_index}.#{pane_index}'
    ], { encoding: 'utf8', timeout: 2000 });

    if (target.stdout) {
      const t = target.stdout.trim();
      const sessionWindow = t.split('.')[0];
      args.push('-execute', `tmux select-window -t '${sessionWindow}' && tmux select-pane -t '${t}'`);
    }
  }

  spawnSync('terminal-notifier', args, { stdio: 'ignore', timeout: 5000 });
}

// stdin path — Claude Code pipes hook input as JSON
const MAX_STDIN = 1024 * 1024;
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});
process.stdin.on('end', () => {
  try {
    const input = data.trim() ? JSON.parse(data) : {};
    notify(TITLE, extractSummary(input.last_assistant_message));
  } catch {
    // Silent — don't break Claude Code if notification fails
  }
});
