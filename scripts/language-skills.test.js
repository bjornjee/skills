#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');

// Each language pattern skill body must stay byte-identical to its
// .claude/rules source: the rule gives Claude Code glob auto-loading,
// the skill gives Codex (and on-demand Claude) the same content.
const PAIRS = [
  ['skills/python-patterns/SKILL.md', '.claude/rules/python.md'],
  ['skills/fastapi-patterns/SKILL.md', '.claude/rules/fastapi.md'],
  ['skills/react-native-patterns/SKILL.md', '.claude/rules/react-native.md'],
  ['skills/ai-ml-patterns/SKILL.md', '.claude/rules/ai-ml.md'],
  ['skills/typescript-patterns/SKILL.md', '.claude/rules/typescript.md'],
];

function body(relativePath) {
  const raw = fs.readFileSync(path.join(REPO, relativePath), 'utf8');
  // Strip the leading YAML frontmatter block; compare bodies only.
  const stripped = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  return stripped.trim() + '\n';
}

describe('language pattern skills stay in lockstep with .claude/rules', () => {
  for (const [skill, rule] of PAIRS) {
    it(`${skill} body matches ${rule}`, () => {
      assert.equal(body(skill), body(rule));
    });
  }
});

// The body check strips frontmatter, so the rules' `paths:` globs — which
// control Claude Code auto-loading — were previously free to drift silently.
// Pin them explicitly; changing a glob must be a deliberate test update.
const EXPECTED_PATHS = {
  '.claude/rules/python.md': ['**/*.py', '**/*.pyi'],
  '.claude/rules/fastapi.md': ['**/main.py', '**/routers/**/*.py', '**/services/**/*.py', '**/models/**/*.py', '**/schemas/**/*.py'],
  '.claude/rules/react-native.md': ['**/*.ts', '**/*.tsx'],
  '.claude/rules/typescript.md': ['**/*.ts', '**/*.tsx'],
  '.claude/rules/ai-ml.md': ['**/evals/**', '**/prompts/**'],
  '.claude/rules/golang.md': ['**/*.go'],
  '.claude/rules/shell.md': ['**/*.sh'],
};

describe('rule paths globs are pinned', () => {
  for (const [rule, expected] of Object.entries(EXPECTED_PATHS)) {
    it(`${rule} keeps its auto-load globs`, () => {
      const raw = fs.readFileSync(path.join(REPO, rule), 'utf8');
      const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
      assert.ok(fm, `${rule} must have frontmatter`);
      const globs = [...fm[1].matchAll(/^\s*-\s*"([^"]+)"\s*$/gm)].map(m => m[1]);
      assert.deepEqual(globs, expected, `${rule} paths: globs changed — update EXPECTED_PATHS deliberately if intended`);
    });
  }
});
