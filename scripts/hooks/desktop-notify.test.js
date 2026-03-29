#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { stripMarkdown, extractSummary, escapeAppleScript, sanitizeShellArg, shouldNotify } = require('./desktop-notify');
const { extractSessionWindow } = require(path.resolve(__dirname, '..', '..', 'packages', 'tmux'));

describe('stripMarkdown', () => {
  it('removes headings', () => {
    assert.equal(stripMarkdown('## Summary'), 'Summary');
    assert.equal(stripMarkdown('# Title'), 'Title');
    assert.equal(stripMarkdown('###### Deep'), 'Deep');
  });

  it('removes bold and italic', () => {
    assert.equal(stripMarkdown('**bold** and *italic*'), 'bold and italic');
  });

  it('removes inline code', () => {
    assert.equal(stripMarkdown('run `npm test` now'), 'run npm test now');
  });

  it('removes code blocks', () => {
    const input = 'before\n' + '```js\ncode\n```' + '\nafter';
    const result = stripMarkdown(input);
    assert.ok(!result.includes('```'), 'should not contain code fences');
    assert.ok(result.includes('before'), 'should keep text before');
    assert.ok(result.includes('after'), 'should keep text after');
  });

  it('removes links but keeps text', () => {
    assert.equal(stripMarkdown('see [docs](https://example.com)'), 'see docs');
  });

  it('removes list markers', () => {
    assert.equal(stripMarkdown('- item one\n* item two'), 'item one\nitem two');
  });

  it('handles empty/whitespace input', () => {
    assert.equal(stripMarkdown('   '), '');
    assert.equal(stripMarkdown(''), '');
  });
});

describe('extractSummary', () => {
  it('returns "Done" for null/undefined/empty', () => {
    assert.equal(extractSummary(null), 'Done');
    assert.equal(extractSummary(undefined), 'Done');
    assert.equal(extractSummary(''), 'Done');
    assert.equal(extractSummary(123), 'Done');
  });

  it('returns first non-empty line', () => {
    assert.equal(extractSummary('\n\nHello world\nSecond line'), 'Hello world');
  });

  it('strips markdown before extracting', () => {
    assert.equal(extractSummary('## Fixed the **bug**'), 'Fixed the bug');
  });

  it('truncates at MAX_BODY (100 chars)', () => {
    const long = 'a'.repeat(150);
    const result = extractSummary(long);
    assert.equal(result.length, 103); // 100 + '...'
    assert.ok(result.endsWith('...'));
  });

  it('does not truncate at exactly 100 chars', () => {
    const exact = 'b'.repeat(100);
    assert.equal(extractSummary(exact), exact);
  });

  it('returns "Done" for whitespace-only lines', () => {
    assert.equal(extractSummary('   \n   \n   '), 'Done');
  });
});

describe('escapeAppleScript', () => {
  it('escapes backslashes', () => {
    assert.equal(escapeAppleScript('path\\to\\file'), 'path\\\\to\\\\file');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeAppleScript('say "hello"'), 'say \\"hello\\"');
  });

  it('handles both together', () => {
    assert.equal(escapeAppleScript('a\\b"c'), 'a\\\\b\\"c');
  });
});

describe('sanitizeShellArg', () => {
  it('keeps safe characters', () => {
    assert.equal(sanitizeShellArg('main:0.1'), 'main:0.1');
    assert.equal(sanitizeShellArg('session_name'), 'session_name');
    assert.equal(sanitizeShellArg('user@host/path'), 'user@host/path');
  });

  it('strips unsafe characters', () => {
    assert.equal(sanitizeShellArg('foo;rm -rf /'), 'foorm-rf/');
    assert.equal(sanitizeShellArg("test'quote"), 'testquote');
    assert.equal(sanitizeShellArg('$(cmd)'), 'cmd');
  });
});

describe('shouldNotify', () => {
  it('returns false when state is running', () => {
    assert.equal(shouldNotify('running', 'Here is the implementation plan for review.'), false);
    assert.equal(shouldNotify('running', 'The feature is complete.'), false);
  });

  it('returns false when message is null or empty regardless of state', () => {
    assert.equal(shouldNotify('input', null), false);
    assert.equal(shouldNotify('input', ''), false);
    assert.equal(shouldNotify('done', undefined), false);
  });

  it('returns false when state is input but message is mid-task question', () => {
    assert.equal(shouldNotify('input', 'Which file should I edit?'), false);
    assert.equal(shouldNotify('input', 'Do you want me to proceed with the refactor?'), false);
    assert.equal(shouldNotify('input', 'Should I use Redis or Memcached for caching?'), false);
  });

  it('returns false when state is done but message has no completion signal', () => {
    assert.equal(shouldNotify('done', 'I updated the config file.'), false);
    assert.equal(shouldNotify('done', 'Here are the changes I made.'), false);
  });

  // Plan review requires 'input' state (plan approval UI shows prompt)
  it('returns true when state is input and message has plan review signal', () => {
    assert.equal(shouldNotify('input', 'Here is the implementation plan. Please review and approve before I proceed.'), true);
    assert.equal(shouldNotify('input', "I've created a plan for this feature. Please review the approach."), true);
    assert.equal(shouldNotify('input', 'Plan is ready for your review.'), true);
  });

  it('returns false when state is done and message has plan review signal', () => {
    assert.equal(shouldNotify('done', 'Here is the implementation plan. Please review.'), false);
  });

  // Completion allows 'input' or 'done' (declarative statements, not questions)
  it('returns true when state is input and message has completion signal', () => {
    assert.equal(shouldNotify('input', 'The feature is complete. All tests pass and changes are committed.'), true);
    assert.equal(shouldNotify('input', 'All changes have been successfully implemented. Ready for your review.'), true);
    assert.equal(shouldNotify('input', 'Implementation is finished. All tests pass.'), true);
  });

  it('returns true when state is done and message has completion signal', () => {
    assert.equal(shouldNotify('done', 'The feature is complete. All tests pass.'), true);
    assert.equal(shouldNotify('done', 'Successfully implemented the notification filter.'), true);
    assert.equal(shouldNotify('done', 'All changes have been implemented. Ready for your review.'), true);
  });

  it('returns false when state is input and message mentions plan casually', () => {
    assert.equal(shouldNotify('input', 'I plan to refactor this module next. Which approach do you prefer?'), false);
  });
});

describe('extractSessionWindow', () => {
  it('extracts session:window from simple target', () => {
    assert.equal(extractSessionWindow('main:0.1'), 'main:0');
  });

  it('handles session names with dots', () => {
    assert.equal(extractSessionWindow('my.project:0.1'), 'my.project:0');
  });

  it('handles IP-like session names', () => {
    assert.equal(extractSessionWindow('127.0.0.1:0.1'), '127.0.0.1:0');
  });

  it('handles multi-digit window and pane indices', () => {
    assert.equal(extractSessionWindow('dev:12.3'), 'dev:12');
  });

  it('returns input unchanged when no dot present', () => {
    assert.equal(extractSessionWindow('main:0'), 'main:0');
  });
});
