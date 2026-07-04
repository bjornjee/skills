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
