#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SKILL = path.join(REPO, 'skills', 'codex-cloud-goal', 'SKILL.md');
const VALIDATOR = path.join(
  REPO,
  'skills',
  'codex-cloud-goal',
  'scripts',
  'validate-cloud-goal.js',
);
const PR_METADATA = {
  title: 'Change',
  body: '## Summary\n\nChange it.\n\n## Test plan\n\n- make test',
  head_branch: 'feat/change',
  base_branch: 'main',
};

function goalState(overrides = {}) {
  return {
    state: 'planned',
    implementation_complete: false,
    verification_passed: false,
    review_passed: false,
    pr_metadata: null,
    pr_url: null,
    last_error: null,
    evidence: [],
    ...overrides,
  };
}

function validate(mode, input) {
  return spawnSync(process.execPath, [VALIDATOR, mode], {
    cwd: REPO,
    input: typeof input === 'string' ? input : `${JSON.stringify(input)}\n`,
    encoding: 'utf8',
  });
}

describe('codex-cloud-goal contract', () => {
  it('accepts an implementation task whose terminal outcome is a PR', () => {
    const result = validate(
      'task',
      'Implement the change, run the full test gate, and create a pull request. Do not merge it.',
    );

    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects task clauses that prohibit the required publication outcome', () => {
    for (const task of [
      'Implement and verify this change, but do not open a PR.',
      'Make the requested edits. Do not create a pull request.',
      'Finish the implementation without publishing a PR.',
      'Implement this, but never open the pull request.',
      'The PR is out of scope.',
      'Avoid creating a pull request.',
      'PR creation disabled.',
      'Leave PR creation to me.',
      'Return a diff only.',
      'Implement this with no push/PR.',
    ]) {
      const result = validate('task', task);
      assert.equal(result.status, 1, task);
      assert.match(result.stderr, /contradicts required pull-request publication/i);
    }
  });

  it('does not mistake the merge boundary for a publication contradiction', () => {
    const result = validate('task', 'Implement, verify, and open a PR. Do not merge it.');

    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects pr_created until every completion criterion and PR URL are present', () => {
    const incompleteStates = [
      goalState({
        state: 'pr_created',
        implementation_complete: false,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/acme/repo/pull/1',
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/pull/42',
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: false,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/acme/repo/pull/1',
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: false,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/acme/repo/pull/1',
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: null,
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/acme/repo/compare/main...feat/change',
        evidence: ['make test: pass', 'review: pass'],
      }),
      goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://example.com/acme/repo/pull/42',
        evidence: ['make test: pass', 'review: pass'],
      }),
    ];

    for (const state of incompleteStates) {
      const result = validate('state', state);
      assert.equal(result.status, 1, JSON.stringify(state));
      assert.match(result.stderr, /requires|pull-request URL/i);
    }
  });

  it('accepts pr_created only with implementation, verification, review, and a concrete PR URL', () => {
    const result = validate('state', goalState({
      state: 'pr_created',
      implementation_complete: true,
      verification_passed: true,
      review_passed: true,
      pr_metadata: PR_METADATA,
      pr_url: 'https://github.com/acme/repo/pull/42',
      evidence: ['make test: pass', 'review: pass'],
    }));

    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects skipped phases and permits repeatable review iteration', () => {
    const skipped = validate('transition', {
      previous: goalState(),
      next: goalState({
        state: 'pr_created',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        pr_url: 'https://github.com/acme/repo/pull/42',
        evidence: ['make test: pass', 'review: pass'],
      }),
    });
    assert.equal(skipped.status, 1);
    assert.match(skipped.stderr, /invalid goal transition/i);

    const iteration = goalState({
      state: 'iterating',
      implementation_complete: true,
      verification_passed: false,
      review_passed: false,
      last_error: 'Review requested changes',
      evidence: ['Reviewer: fix the missing edge case'],
    });
    const verifying = goalState({
      state: 'verifying',
      implementation_complete: true,
    });
    assert.equal(validate('transition', { previous: iteration, next: verifying }).status, 0);
    const reviewing = goalState({
      state: 'reviewing',
      implementation_complete: true,
      verification_passed: true,
      evidence: ['make test: pass'],
    });
    assert.equal(validate('transition', { previous: verifying, next: reviewing }).status, 0);
    assert.equal(validate('transition', { previous: reviewing, next: iteration }).status, 0);
  });

  it('keeps verification, review, and publication failures nonterminal with evidence', () => {
    for (const state of [
      goalState({
        state: 'iterating',
        implementation_complete: true,
        last_error: 'Verification failed',
        evidence: ['make test: exit 1'],
      }),
      goalState({
        state: 'iterating',
        implementation_complete: true,
        verification_passed: true,
        last_error: 'Review found a blocker',
        evidence: ['P1: unsafe path handling'],
      }),
      goalState({
        state: 'publishing',
        implementation_complete: true,
        verification_passed: true,
        review_passed: true,
        pr_metadata: PR_METADATA,
        last_error: 'Publication capability unavailable',
        evidence: ['publisher: unavailable'],
      }),
    ]) {
      const result = validate('state', state);
      assert.equal(result.status, 0, result.stderr);
      assert.notEqual(state.state, 'pr_created');
      assert.equal(state.pr_url, null);
    }
  });

  it('enforces completion flag implications in every phase', () => {
    const verifiedWithoutImplementation = validate('state', goalState({
      state: 'iterating',
      verification_passed: true,
      last_error: 'Invalid state',
      evidence: ['verification cannot precede implementation'],
    }));
    assert.equal(verifiedWithoutImplementation.status, 1);
    assert.match(verifiedWithoutImplementation.stderr, /verification_passed requires/i);

    const reviewedWithoutVerification = validate('state', goalState({
      state: 'iterating',
      implementation_complete: true,
      review_passed: true,
      last_error: 'Invalid state',
      evidence: ['review cannot precede verification'],
    }));
    assert.equal(reviewedWithoutVerification.status, 1);
    assert.match(reviewedWithoutVerification.stderr, /review_passed requires/i);
  });

  it('carries the required external publication contract without worker credential fallback', () => {
    const skill = require('node:fs').readFileSync(SKILL, 'utf8');
    assert.match(skill, /<publishing>[\s\S]*The outcome of this goal is a created pull request\.[\s\S]*<\/publishing>/);
    assert.match(skill, /worker must not run `git push` or publish/i);
    assert.match(skill, /configured Codex Cloud publication capability/i);
    assert.doesNotMatch(skill, /GH_TOKEN|GITHUB_TOKEN/);
  });
});
