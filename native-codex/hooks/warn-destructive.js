#!/usr/bin/env node
'use strict';

const path = require('node:path');

// Advisory lexical check, not a shell interpreter or authorization boundary.
// No expansion of aliases, variables, substitutions, eval, or script bodies.
function commands(command) {
  const segments = [[]];
  const words = command.match(/"(?:\\.|[^"\\])*"|'[^']*'|[^\s|;&]+|[|;&\n]/g) || [];
  for (const word of words) {
    if (/^[|;&\n]$/.test(word)) segments.push([]);
    else segments[segments.length - 1].push(word.replace(/^("|')([\s\S]*)\1$/, '$2'));
  }
  return segments.filter(tokens => tokens.length).map(tokens => {
    tokens[0] = path.basename(tokens[0]);
    if (tokens[0] === 'git') {
      let index = 1;
      while (tokens[index]?.startsWith('-')) {
        index += ['-C', '-c', '--git-dir', '--work-tree', '--namespace'].includes(tokens[index]) ? 2 : 1;
      }
      return [tokens[0], ...tokens.slice(index)];
    }
    return tokens;
  });
}

function hasRmRF(tokens) {
    if (tokens[0] !== 'rm') return false;
    let recursive = false;
    let force = false;
    for (const token of tokens.slice(1)) {
      if (token === '--') break;
      if (token === '--recursive') recursive = true;
      else if (token === '--force') force = true;
      else if (/^-[^-]/.test(token)) {
        recursive ||= /[rR]/.test(token);
        force ||= /f/.test(token);
      }
    }
    return recursive && force;
}

const DESTRUCTIVE_PATTERNS = [
  { test: hasRmRF, label: 'rm -rf' },
  { pattern: /^git\s+reset\s+--hard\b/, label: 'git reset --hard' },
  { pattern: /^git\s+push\b[^\n]*(?:\s--force(?:=\S+|\s|$)|\s-f(?:\s|$))/, label: 'git push --force' },
  { pattern: /^git\s+clean\s+[^\n]*-[^\s]*f/, label: 'git clean -f' },
  { pattern: /^git\s+checkout\s+\.\s*$/, label: 'git checkout .' },
  { pattern: /^git\s+restore\s+\.\s*$/, label: 'git restore .' },
  { pattern: /^drop\s+table\b/i, label: 'DROP TABLE' },
  { pattern: /^drop\s+database\b/i, label: 'DROP DATABASE' },
  { pattern: /^truncate\s+table\b/i, label: 'TRUNCATE TABLE' },
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

    for (const tokens of commands(command)) {
      for (const { pattern, test, label } of DESTRUCTIVE_PATTERNS) {
        if (test ? test(tokens) : pattern.test(tokens.join(' '))) {
          block(`"${label}" is destructive`);
          return;
        }
      }
    }
  });
}
