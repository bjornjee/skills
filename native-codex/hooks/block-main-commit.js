#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

function extractCwd(command) {
  const match = command.match(/^\s*cd\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*(?:&&|;|\|\||$)/);
  const cwd = match && (match[1] || match[2] || match[3]);
  return cwd && cwd.startsWith('/') ? cwd : null;
}

function containsCommit(command) {
  return command.split(/[;&]+/).some(segment => /^\s*git\s+commit\b/.test(segment));
}

function run(input) {
  const command = input.tool_input?.command || '';
  if (!containsCommit(command)) return {};

  const cwd = extractCwd(command) || input.cwd || input.tool_input?.cwd;
  const result = spawnSync('git', ['branch', '--show-current'], {
    cwd,
    encoding: 'utf8',
    timeout: 3000,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const branch = result.status === 0 ? result.stdout.trim() : '';
  if (branch === 'main' || branch === 'master') {
    process.stderr.write(
      'Blocked: git commit on main/master is not allowed. Create a worktree branch first.\n',
    );
    process.exit(2);
  }

  return {};
}

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  process.stdout.write(`${JSON.stringify(run(data.trim() ? JSON.parse(data) : {}))}\n`);
});
