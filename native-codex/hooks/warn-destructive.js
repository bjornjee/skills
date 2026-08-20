#!/usr/bin/env node
'use strict';

function hasRmRF(command) {
  for (const segment of command.split(/[|;&\n]+/)) {
    const tokens = segment.trim().split(/\s+/);
    const rmIndex = tokens.indexOf('rm');
    if (rmIndex === -1) continue;

    let recursive = false;
    let force = false;
    for (const token of tokens.slice(rmIndex + 1)) {
      if (token === '--') break;
      if (token === '--recursive') recursive = true;
      else if (token === '--force') force = true;
      else if (/^-[^-]/.test(token)) {
        recursive ||= /[rR]/.test(token);
        force ||= /f/.test(token);
      }
    }
    if (recursive && force) return true;
  }
  return false;
}

const DESTRUCTIVE_PATTERNS = [
  { test: hasRmRF, label: 'rm -rf' },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: 'git reset --hard' },
  { pattern: /\bgit\s+push\b[^\n]*(?:\s--force(?:=\S+|\s|$)|\s-f(?:\s|$))/, label: 'git push --force' },
  { pattern: /\bgit\s+clean\s+[^\n]*-[^\s]*f/, label: 'git clean -f' },
  { pattern: /\bgit\s+checkout\s+\.\s*([;&|]|$)/, label: 'git checkout .' },
  { pattern: /\bgit\s+restore\s+\.\s*([;&|]|$)/, label: 'git restore .' },
  { pattern: /\bdrop\s+table\b/i, label: 'DROP TABLE' },
  { pattern: /\bdrop\s+database\b/i, label: 'DROP DATABASE' },
  { pattern: /\btruncate\s+table\b/i, label: 'TRUNCATE TABLE' },
];

function block(reason) {
  process.stderr.write(`Blocked: ${reason}. Ask the user to run it manually if intentional.\n`);
  process.exitCode = 2;
}

module.exports = { DESTRUCTIVE_PATTERNS, hasRmRF };

if (require.main === module && !process.stdin.isTTY) {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { data += chunk; });
  process.stdin.on('end', () => {
    let input;
    try {
      input = JSON.parse(data);
    } catch {
      block('invalid hook input');
      return;
    }

    const command = input && input.hook_event_name === 'PreToolUse'
      && input.tool_name === 'Bash'
      && input.tool_input
      && typeof input.tool_input.command === 'string'
      ? input.tool_input.command
      : null;
    if (command === null) {
      block('invalid hook input');
      return;
    }

    for (const { pattern, test, label } of DESTRUCTIVE_PATTERNS) {
      if (test ? test(command) : pattern.test(command)) {
        block(`"${label}" is destructive`);
        return;
      }
    }
  });
}
