#!/usr/bin/env node
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { stripMarkdown, extractSummary, escapeAppleScript, sanitizeShellArg } = require('./desktop-notify');

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
