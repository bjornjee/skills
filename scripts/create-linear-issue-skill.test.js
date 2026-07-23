#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SKILL_PATH = path.join(REPO, 'skills/create-linear-issue/SKILL.md');
const METADATA_PATH = path.join(
  REPO,
  'skills/create-linear-issue/agents/openai.yaml',
);
const PACKAGED_SKILL_PATH = path.join(
  REPO,
  'plugins/skills/skills/create-linear-issue/SKILL.md',
);

function read(relativePath) {
  return fs.readFileSync(path.join(REPO, relativePath), 'utf8');
}

function skill() {
  return fs.readFileSync(SKILL_PATH, 'utf8');
}

function prose(content = skill()) {
  return content.replace(/\s+/g, ' ');
}

function contractTemplate() {
  const match = skill().match(/```md\n([\s\S]*?)\n```/);
  assert.ok(match, 'skill must contain a fenced Codex Agent Task v1 template');
  return match[1];
}

describe('create-linear-issue behavior contract', () => {
  it('exists in the canonical skill tree', () => {
    assert.equal(fs.existsSync(SKILL_PATH), true);
    assert.equal(fs.existsSync(METADATA_PATH), true);
  });

  it('is exposed through the shared Codex plugin package', () => {
    assert.equal(fs.existsSync(PACKAGED_SKILL_PATH), true);
    assert.equal(
      fs.realpathSync(PACKAGED_SKILL_PATH),
      fs.realpathSync(SKILL_PATH),
    );
  });

  it('renders the exact Codex Agent Task v1 section order', () => {
    const headings = [...contractTemplate().matchAll(/^## .+$/gm)]
      .map(match => match[0]);

    assert.deepEqual(headings, [
      '## Goal',
      '## Context',
      '## Scope',
      '## Acceptance Criteria',
      '## Verification',
      '## Risk',
      '## Notes For Agent',
    ]);
  });

  it('rejects malformed or unfinished contracts before mutation', () => {
    const content = prose();

    assert.match(content, /before (?:any )?mutation/i);
    assert.match(content, /empty/i);
    assert.match(content, /duplicate/i);
    assert.match(content, /out-of-order/i);
    assert.match(content, /placeholder/i);
    assert.match(content, /malformed/i);
  });

  it('requires an explicit target repository and compatible workflow mapping', () => {
    const content = prose();

    assert.match(content, /explicit target repository/i);
    assert.match(content, /project-to-repository (?:workflow )?mapping/i);
    assert.match(content, /clone(?:s| hook)? the target repository/i);
    assert.match(content, /ticket-level `cd`/i);
    assert.match(content, /conflict/i);
  });

  it('resolves and validates the complete destination before creation', () => {
    const content = skill();
    const resolution = content.indexOf('### 3. Resolve');
    const creation = content.indexOf('### 4. Create');

    assert.ok(resolution >= 0 && creation > resolution);
    for (const field of ['team', 'project', 'state', 'labels']) {
      assert.match(content.slice(resolution, creation), new RegExp(field, 'i'));
    }
    assert.match(content.slice(resolution, creation), /exactly one/i);
    assert.match(content.slice(resolution, creation), /does not belong/i);
  });

  it('limits explicit create authority to one issue and narrows ambiguity', () => {
    const content = prose();

    assert.match(content, /explicit create request/i);
    assert.match(content, /one resulting issue/i);
    assert.match(content, /one narrow question/i);
    assert.match(content, /zero matches or multiple matches/i);
  });

  it('reconciles uncertain creation with a bounded read before stopping', () => {
    const content = prose();

    assert.match(content, /uncertain create result/i);
    assert.match(content, /read-only reconciliation/i);
    assert.match(content, /bounded invocation window/i);
    assert.match(content, /exact title and team/i);
    assert.match(content, /at most two result pages/i);
    assert.match(content, /do not blindly retry/i);
  });

  it('reads back and verifies every created issue field', () => {
    const content = skill();
    const readback = content.match(
      /### 6\. Verify by readback([\s\S]*?)### 7\./,
    );

    assert.ok(readback);
    for (const field of [
      'title',
      'description',
      'team',
      'project',
      'state',
      'labels',
    ]) {
      assert.match(readback[1], new RegExp(field, 'i'));
    }
  });

  it('dispatches only with explicit authority after successful readback', () => {
    const content = skill();
    const dispatch = content.match(
      /### 7\. Optionally dispatch([\s\S]*?)### 8\./,
    );

    assert.ok(dispatch);
    assert.match(dispatch[1], /`codex-ready` is never implicit/i);
    assert.match(prose(dispatch[1]), /explicitly requested/i);
    assert.match(dispatch[1], /initial readback is exact/i);
    assert.match(dispatch[1], /existing labels are preserved/i);
    assert.match(dispatch[1], /read the issue back again/i);
  });

  it('uses connected Linear tooling without local transport dependencies', () => {
    const content = prose();

    assert.match(content, /connected Linear tools/i);
    assert.doesNotMatch(content, /\.codex\/skills\/linear/i);
    assert.doesNotMatch(content, /agent-dashboard/i);
    assert.match(
      content,
      /do not create teams, projects, workflow states, or labels/i,
    );
  });

  it('requires repository-owned verification entrypoints', () => {
    const content = prose();

    assert.match(content, /documented repository entrypoint/i);
    assert.match(content, /agent selects smallest sufficient proof/i);
    assert.match(content, /do not prescribe absolute paths/i);
    assert.match(content, /global Codex or skill installation paths/i);
    assert.match(content, /bare language runtime invoking a host-global script/i);
  });
});

describe('create-linear-issue metadata', () => {
  it('provides matching quoted OpenAI interface metadata', () => {
    const metadata = read('skills/create-linear-issue/agents/openai.yaml');

    assert.match(metadata, /^interface:\n/);
    assert.match(metadata, /^  display_name: "Create Linear Issue"$/m);
    assert.match(metadata, /^  short_description: "[^"]{25,64}"$/m);
    assert.match(
      metadata,
      /^  default_prompt: "Use \$create-linear-issue [^"]+"$/m,
    );
  });
});
