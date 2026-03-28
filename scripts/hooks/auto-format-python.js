#!/usr/bin/env node
/**
 * PostToolUse hook for Write|Edit — auto-formats Python files.
 *
 * Runs ruff format + ruff check --fix on .py files.
 * Falls back to black if ruff is not available.
 * Silent on failure — never breaks the workflow.
 */

'use strict';

const { spawnSync } = require('child_process');

function hasCommand(cmd) {
  const result = spawnSync('which', [cmd], { stdio: 'ignore', timeout: 2000 });
  return result.status === 0;
}

function formatWithRuff(filePath) {
  spawnSync('ruff', ['format', filePath], { stdio: 'ignore', timeout: 10000 });
  spawnSync('ruff', ['check', '--fix', filePath], { stdio: 'ignore', timeout: 10000 });
}

function formatWithBlack(filePath) {
  spawnSync('black', ['--quiet', filePath], { stdio: 'ignore', timeout: 10000 });
}

let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    if (!filePath.endsWith('.py') || filePath.startsWith('-')) {
      process.stdout.write(data);
      return;
    }

    if (hasCommand('ruff')) {
      formatWithRuff(filePath);
    } else if (hasCommand('black')) {
      formatWithBlack(filePath);
    }

    process.stdout.write(data);
  } catch {
    // Silent — don't break Claude Code
    if (data) process.stdout.write(data);
  }
});
