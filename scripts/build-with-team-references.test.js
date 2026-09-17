'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const SKILL = path.join(REPO, 'skills/build-with-team');

function checkLocalLinks(root, directory = root) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      checkLocalLinks(root, filename);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const source = fs.readFileSync(filename, 'utf8');
    for (const [, link] of source.matchAll(/\]\(([^\s)]+)\)/g)) {
      if (/^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('#')) continue;
      const target = path.resolve(directory, decodeURIComponent(link.split('#')[0]));
      const relative = path.relative(root, target);
      assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
        `${filename}: reference escapes distributable bundle: ${link}`);
      assert.ok(fs.existsSync(target), `${filename}: missing local reference: ${link}`);
    }
  }
}

it('build-with-team runtime references resolve within the installed bundle', () => {
  checkLocalLinks(SKILL);
});

it('build-with-team evaluator references resolve outside the runtime bundle', () => {
  checkLocalLinks(path.join(REPO, 'evaluations/build-with-team'));
});

it('reference validation detects a broken link inside a nested reference', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'team-reference-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'references'));
  fs.writeFileSync(path.join(root, 'SKILL.md'), '[Read](references/guide.md)');
  fs.writeFileSync(path.join(root, 'references/guide.md'), '[Missing](absent.md#section)');
  assert.throws(() => checkLocalLinks(root), /missing local reference: absent\.md/);
});
