#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const mode = process.argv[2];
if (!['task', 'state', 'transition'].includes(mode) || process.argv.length !== 3) {
  process.stderr.write('usage: validate-cloud-goal.js <task|state|transition> < input\n');
  process.exit(2);
}

const input = fs.readFileSync(0, 'utf8');

function reject(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function validateTask(task) {
  const normalized = task.toLowerCase().replace(/\s+/g, ' ').trim();
  const prohibited = [
    /\b(?:do not|don't|must not|never) (?:open|create|publish|submit|push) (?:(?:a|the|any) )?(?:pr|pull request)\b/,
    /\b(?:without|avoid) (?:opening|creating|publishing|submitting|pushing) (?:(?:a|the|any) )?(?:pr|pull request)\b/,
    /\bno (?:pr|pull request)\b/,
    /\b(?:return )?(?:a |the )?diff only\b/,
    /\bno push\s*(?:\/|or|and)\s*(?:pr|pull request)\b/,
    /\b(?:pr|pull request) (?:is|are) (?:out of scope|forbidden|not required)\b/,
    /\b(?:pr|pull request) creation (?:is )?(?:disabled|forbidden|out of scope)\b/,
    /\bleave (?:pr|pull request) creation to (?:me|the user)\b/,
  ];
  if (prohibited.some(pattern => pattern.test(normalized))) {
    reject('task contradicts required pull-request publication');
  }
}

function isPullRequestUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'github.com'
      && url.username === ''
      && url.password === ''
      && url.search === ''
      && url.hash === ''
      && /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function validMetadata(metadata) {
  return metadata
    && !Array.isArray(metadata)
    && typeof metadata === 'object'
    && ['title', 'body', 'head_branch', 'base_branch']
      .every(key => typeof metadata[key] === 'string' && metadata[key].trim() !== '')
    && /^## Summary\b/im.test(metadata.body)
    && /^## Test plan\b/im.test(metadata.body);
}

function validateState(state) {
  const states = new Set([
    'planned',
    'implementing',
    'verifying',
    'reviewing',
    'iterating',
    'publishing',
    'pr_created',
  ]);
  if (!state || Array.isArray(state) || typeof state !== 'object' || !states.has(state.state)) {
    reject('invalid goal state');
  }
  for (const key of ['implementation_complete', 'verification_passed', 'review_passed']) {
    if (typeof state[key] !== 'boolean') reject(`goal state requires boolean ${key}`);
  }
  if (state.verification_passed && !state.implementation_complete) {
    reject('verification_passed requires implementation_complete');
  }
  if (state.review_passed && !state.verification_passed) {
    reject('review_passed requires verification_passed');
  }
  if (state.pr_metadata !== null && !validMetadata(state.pr_metadata)) {
    reject('goal state pr_metadata must be null or complete PR metadata');
  }
  if (state.last_error !== null
    && (typeof state.last_error !== 'string' || state.last_error.trim() === '')) {
    reject('goal state last_error must be null or a non-empty string');
  }
  if (!Array.isArray(state.evidence)
    || state.evidence.some(item => typeof item !== 'string' || item.trim() === '')) {
    reject('goal state evidence must be an array of non-empty strings');
  }
  if (state.state === 'pr_created'
    && (!state.implementation_complete
      || !state.verification_passed
      || !state.review_passed
      || !validMetadata(state.pr_metadata)
      || !isPullRequestUrl(state.pr_url)
      || state.last_error !== null
      || state.evidence.length === 0)) {
    reject('pr_created requires implementation_complete, verification_passed, review_passed, pr_metadata, and pr_url');
  }
  if (state.pr_url !== null && !isPullRequestUrl(state.pr_url)) {
    reject('goal state pr_url must be null or a concrete HTTPS pull-request URL');
  }
  if (state.state !== 'pr_created' && state.pr_url !== null) {
    reject('only pr_created may record pr_url');
  }
  if (['planned', 'implementing'].includes(state.state)
    && (state.implementation_complete
      || state.verification_passed
      || state.review_passed
      || state.pr_metadata !== null
      || state.last_error !== null
      || state.evidence.length !== 0)) {
    reject(`${state.state} contains completed or stale state`);
  }
  if (state.state === 'verifying'
    && (!state.implementation_complete
      || state.verification_passed
      || state.review_passed
      || state.pr_metadata !== null
      || state.last_error !== null)) {
    reject('verifying requires completed implementation and cleared downstream state');
  }
  if (state.state === 'reviewing'
    && (!state.implementation_complete
      || !state.verification_passed
      || state.review_passed
      || state.pr_metadata !== null
      || state.last_error !== null
      || state.evidence.length === 0)) {
    reject('reviewing requires passed verification and cleared downstream state');
  }
  if (state.state === 'iterating'
    && (state.review_passed
      || state.pr_metadata !== null
      || state.last_error === null
      || state.evidence.length === 0)) {
    reject('iterating requires explicit failure or review evidence and cleared publication state');
  }
  if (state.state === 'publishing'
    && (!state.implementation_complete
      || !state.verification_passed
      || !state.review_passed
      || !validMetadata(state.pr_metadata))) {
    reject('publishing requires completed implementation, passed verification/review, and PR metadata');
  }
  return state;
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    reject(`invalid ${label} JSON: ${error.message}`);
  }
}

function validateTransition(raw) {
  const transition = parseJson(raw, 'goal transition');
  if (!transition || Array.isArray(transition) || typeof transition !== 'object') {
    reject('invalid goal transition');
  }
  const previous = validateState(transition.previous);
  const next = validateState(transition.next);
  const allowed = {
    planned: ['planned', 'implementing'],
    implementing: ['implementing', 'verifying', 'iterating'],
    verifying: ['verifying', 'reviewing', 'iterating'],
    reviewing: ['reviewing', 'iterating', 'publishing'],
    iterating: ['iterating', 'verifying'],
    publishing: ['publishing', 'pr_created'],
    pr_created: ['pr_created'],
  };
  if (!allowed[previous.state].includes(next.state)) {
    reject(`invalid goal transition: ${previous.state} -> ${next.state}`);
  }
}

if (mode === 'task') validateTask(input);
else if (mode === 'state') validateState(parseJson(input, 'goal state'));
else validateTransition(input);

process.stdout.write('ok\n');
