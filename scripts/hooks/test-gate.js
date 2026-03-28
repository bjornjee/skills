#!/usr/bin/env node
/**
 * PreToolUse hook for Bash — blocks git commit unless `make test` passes.
 *
 * Delegates entirely to the project's Makefile. If no Makefile or test target
 * exists, nudges the user to add one (but does not block the commit).
 *
 * Set SKIP_TEST_GATE=1 to bypass (WIP commits, docs-only changes).
 * Exit code 2 blocks the tool call. Writes reason to stderr.
 */

'use strict';

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

function isGitCommit(command) {
  return /\bgit\s+commit\b/.test(command);
}

function shouldSkip() {
  return process.env.SKIP_TEST_GATE === '1';
}

function getRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return process.cwd();
  }
}

function hasMakefile(cwd) {
  return existsSync(path.join(cwd, 'Makefile'));
}

function hasMakeTestTarget(cwd) {
  if (!hasMakefile(cwd)) return false;
  try {
    execSync('make -n test 2>/dev/null', { stdio: 'pipe', cwd });
    return true;
  } catch {
    return false;
  }
}

function runMakeTest(cwd) {
  try {
    execSync('make test', { stdio: 'pipe', timeout: 300000, cwd });
    return { passed: true };
  } catch (err) {
    const stdout = (err.stdout || '').toString();
    const stderr = (err.stderr || '').toString();
    const output = stdout + stderr;
    return { passed: false, output: output.slice(Math.max(0, output.length - 2000)) };
  }
}

// Export for testing
module.exports = { isGitCommit, shouldSkip, getRepoRoot, hasMakefile, hasMakeTestTarget, runMakeTest };

// Only run as hook when executed directly (stdin is piped)
if (!process.stdin.isTTY) {
  let data = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { data += chunk; });
  process.stdin.on('end', () => {
    try {
      const input = JSON.parse(data);
      const command = (input.tool_input && input.tool_input.command) || '';

      if (!isGitCommit(command)) {
        process.stdout.write(data);
        return;
      }

      if (shouldSkip()) {
        process.stdout.write(data);
        return;
      }

      const repoRoot = getRepoRoot();

      if (!hasMakefile(repoRoot)) {
        process.stderr.write(
          `Warning: No Makefile found at project root. ` +
          `Add a Makefile with a "test" target (and "fmt" for formatting) ` +
          `to enable pre-commit test gating.\n`
        );
        process.stdout.write(data);
        return;
      }

      if (!hasMakeTestTarget(repoRoot)) {
        process.stderr.write(
          `Warning: Makefile exists but has no "test" target. ` +
          `Add a "test" target to enable pre-commit test gating. ` +
          `Consider also adding a "fmt" target for formatting.\n`
        );
        process.stdout.write(data);
        return;
      }

      const result = runMakeTest(repoRoot);
      if (!result.passed) {
        process.stderr.write(
          `Blocked: tests failed. Fix failing tests before committing.\n\n` +
          `${result.output}\n\n` +
          `Set SKIP_TEST_GATE=1 to bypass (e.g., for WIP commits).\n`
        );
        process.exit(2);
      }

      process.stdout.write(data);
    } catch {
      process.stdout.write(data);
    }
  });
}
