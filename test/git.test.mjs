import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { getGitInfo } from '../dist/git.js';

function mockGit(t, run) {
  t.mock.method(childProcess, 'execFileSync', run);
  syncBuiltinESMExports();
  t.after(() => {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
}

function gitOutput(args) {
  if (args.includes('--is-inside-work-tree')) return 'true\n';
  if (args.includes('--abbrev-ref')) return 'feature/statusline\n';
  return ' M src/git.ts\n';
}

test('Git collection uses PATH Git directly with the requested directory', (t) => {
  mockGit(t, (file, args, options) => {
    assert.equal(file, 'git');
    assert.equal(options.cwd, '/project with spaces');
    assert.equal(options.timeout, 2000);
    return gitOutput(args);
  });
  assert.deepEqual(getGitInfo('/project with spaces'), {
    branch: 'feature/statusline', dirty: true,
  });
});

test('macOS falls back to system Git when PATH Git cannot start', {
  skip: process.platform !== 'darwin',
}, (t) => {
  for (const code of ['Unknown system error -86', 'ENOENT', 'EACCES']) {
    const calls = [];
    mockGit(t, (file, args) => {
      calls.push(file);
      if (file === 'git') throw Object.assign(new Error('Cannot start Git'), { code, status: null });
      assert.equal(file, '/usr/bin/git');
      return gitOutput(args);
    });
    assert.deepEqual(getGitInfo('/project'), { branch: 'feature/statusline', dirty: true });
    assert.deepEqual(calls, ['git', '/usr/bin/git', '/usr/bin/git', '/usr/bin/git']);
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('Git command errors and timeouts do not trigger a system Git retry', (t) => {
  for (const error of [
    { status: 128 },
    { code: 'ETIMEDOUT', status: null },
  ]) {
    let calls = 0;
    mockGit(t, (file) => {
      calls++;
      assert.equal(file, 'git');
      throw Object.assign(new Error('Git failed'), error);
    });
    assert.equal(getGitInfo('/not-a-repository'), null);
    assert.equal(calls, 1);
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('Git collection degrades quietly when neither executable starts', (t) => {
  mockGit(t, () => {
    throw Object.assign(new Error('Missing Git'), { code: 'ENOENT', status: null });
  });
  assert.equal(getGitInfo('/project'), null);
  assert.equal(getGitInfo(undefined), null);
});
