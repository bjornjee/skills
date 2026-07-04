#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SKILLS_ROOT = path.join(REPO, 'skills');

// Minimal frontmatter check — a skill without a parseable name/description
// installs silently and is undiscoverable by the model.
function frontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  let currentKey = null;
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fields[currentKey] = kv[2];
    } else if (currentKey && /^\s+\S/.test(line)) {
      fields[currentKey] += ' ' + line.trim(); // folded multi-line value
    }
  }
  return fields;
}

describe('skill frontmatter', () => {
  const dirs = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  it('finds at least the known skill count', () => {
    assert.ok(dirs.length >= 24, `expected >= 24 skills, found ${dirs.length}`);
  });

  for (const dir of dirs) {
    it(`${dir} has valid frontmatter`, () => {
      const skillPath = path.join(SKILLS_ROOT, dir, 'SKILL.md');
      assert.ok(fs.existsSync(skillPath), `${dir}/SKILL.md must exist`);
      const fields = frontmatter(fs.readFileSync(skillPath, 'utf8'));
      assert.ok(fields, `${dir}/SKILL.md must start with a --- frontmatter block`);
      assert.equal(fields.name, dir, 'frontmatter name must match the directory name');
      assert.ok(
        fields.description && fields.description.trim().length >= 20,
        'description must exist and be a usable trigger (>= 20 chars)',
      );
    });
  }
});
