#!/usr/bin/env node
'use strict';

function hasRmRF(command) {
  const segments = command.split(/[|;&\n]+/);
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (/\brm\s+(-[^\s]*r[^\s]*f|-\S*f\S*r)\s+.*worktrees?\b/.test(trimmed)) continue;

    const tokens = trimmed.split(/\s+/);
    const rmIndex = tokens.indexOf('rm');
    if (rmIndex === -1) continue;

    let flags = '';
    for (let index = rmIndex + 1; index < tokens.length; index += 1) {
      if (tokens[index] === '--') break;
      if (tokens[index].startsWith('--')) continue;
      if (tokens[index].startsWith('-')) flags += tokens[index];
    }
    if (/[rR]/.test(flags) && /f/.test(flags)) return true;
  }
  return false;
}

const DESTRUCTIVE_PATTERNS = [
  { test: hasRmRF, label: 'rm -rf' },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: 'git reset --hard' },
  { pattern: /\bgit\s+push\s+.*--force\b/, label: 'git push --force' },
  { pattern: /\bgit\s+push\s+-f\b/, label: 'git push -f' },
  { pattern: /\bgit\s+clean\s+(-[^\s]*f[^\s]*|-f)\b/, label: 'git clean -f' },
  { pattern: /\bgit\s+checkout\s+\.\s*([;&|]|$)/, label: 'git checkout .' },
  { pattern: /\bgit\s+restore\s+\.\s*([;&|]|$)/, label: 'git restore .' },
  { pattern: /\bdrop\s+table\b/i, label: 'DROP TABLE' },
  { pattern: /\bdrop\s+database\b/i, label: 'DROP DATABASE' },
  { pattern: /\btruncate\s+table\b/i, label: 'TRUNCATE TABLE' },
  { pattern: /\btmux\s+send-keys\b/, label: 'tmux send-keys (cross-pane injection)' },
];

module.exports = { DESTRUCTIVE_PATTERNS, hasRmRF };

if (require.main === module && !process.stdin.isTTY) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { data += chunk; });
  process.stdin.on('end', () => {
    try {
      const input = data.trim() ? JSON.parse(data) : {};
      const command = input.tool_input?.command || '';
      const worktreeRemove = /\bgit\s+worktree\s+remove\b/.test(command);
      const worktreeClean = /worktrees?\//.test(command)
        && /\bgit\s+(clean|checkout|restore)\b/.test(command);

      for (const { pattern, test, label } of DESTRUCTIVE_PATTERNS) {
        const matches = test ? test(command) : pattern.test(command);
        if (matches && !worktreeRemove && !worktreeClean) {
          process.stderr.write(
            `Blocked: "${label}" is destructive. Ask the user to run it manually if intentional.\n`,
          );
          process.exit(2);
        }
      }
    } catch {
      // Invalid hook input must not block unrelated Codex operations.
    }
    process.stdout.write('{}\n');
  });
}
