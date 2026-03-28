#!/usr/bin/env node
/**
 * PreToolUse hook for Bash — blocks destructive commands.
 *
 * Exit code 2 blocks the tool call. Writes reason to stderr.
 */

'use strict';

function hasRmRF(cmd) {
  if (!/\brm\b/.test(cmd)) return false;
  const combined = /\brm\s[^|;&\n]*-[^\s-]*[rR][^\s-]*f|rm\s[^|;&\n]*-[^\s-]*f[^\s-]*[rR]/.test(cmd);
  const separate = /\brm\s[^|;&\n]*-[rR]\b/.test(cmd) && /\brm\s[^|;&\n]*-f\b/.test(cmd);
  return combined || separate;
}

const DESTRUCTIVE_PATTERNS = [
  { test: hasRmRF,                                   label: 'rm -rf' },
  { pattern: /\bgit\s+reset\s+--hard\b/,             label: 'git reset --hard' },
  { pattern: /\bgit\s+push\s+.*--force\b/,           label: 'git push --force' },
  { pattern: /\bgit\s+push\s+-f\b/,                  label: 'git push -f' },
  { pattern: /\bgit\s+clean\s+(-[^\s]*f[^\s]*|-f)\b/, label: 'git clean -f' },
  { pattern: /\bgit\s+checkout\s+\.\s*([;&|]|$)/,    label: 'git checkout .' },
  { pattern: /\bgit\s+restore\s+\.\s*([;&|]|$)/,     label: 'git restore .' },
  { pattern: /\bdrop\s+table\b/i,                     label: 'DROP TABLE' },
  { pattern: /\bdrop\s+database\b/i,                  label: 'DROP DATABASE' },
  { pattern: /\btruncate\s+table\b/i,                 label: 'TRUNCATE TABLE' },
];

let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const command = (input.tool_input && input.tool_input.command) || '';

    for (const { pattern, test, label } of DESTRUCTIVE_PATTERNS) {
      const match = test ? test(command) : pattern.test(command);
      if (match) {
        process.stderr.write(
          `Blocked: "${label}" is a destructive command. ` +
          `If intentional, ask the user to run it manually.\n`
        );
        process.exit(2);
      }
    }

    // Pass through — print original input to stdout
    process.stdout.write(data);
  } catch {
    // On parse error, don't block — let it through
    process.stdout.write(data);
  }
});
