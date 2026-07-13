#!/usr/bin/env node
'use strict';

const VALID_TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci'];
const COMMIT_RE = /^(feat|fix|refactor|docs|test|chore|perf|ci):\s+\S/;

function extractCommitMessage(command) {
  const heredoc = command.match(
    /(?:-[A-Za-z]*m[A-Za-z]*|--message)(?:=|\s+)"\$\(cat\s+<\<'?EOF'?\n([\s\S]*?)\nEOF\n?\s*\)"/,
  );
  if (heredoc) return heredoc[1].trim();

  const message = command.match(
    /\bgit\s+commit\b[^]*?(?:-[A-Za-z]*m[A-Za-z]*|--message)(?:=|\s+)(?:"([^"]+)"|'([^']+)'|([^\s;&]+))/,
  );
  return message ? message[1] || message[2] || message[3] : null;
}

function run(input) {
  const command = input.tool_input?.command || '';
  if (!/\bgit\s+commit\b/.test(command)) return {};

  const message = extractCommitMessage(command);
  if (message === null) return {};

  const firstLine = message.split('\n')[0].trim();
  if (!COMMIT_RE.test(firstLine)) {
    process.stderr.write(
      `Blocked: commit message "${firstLine}" does not follow conventional format.\n` +
      'Expected: <type>: <description>\n' +
      `Valid types: ${VALID_TYPES.join(', ')}\n`,
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
