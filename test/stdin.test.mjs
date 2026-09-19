import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Linux child-process stdin can be a socket that cannot be reopened as /dev/stdin.
const bootstrap = `
  import fs from 'node:fs';
  import { syncBuiltinESMExports } from 'node:module';
  const read = fs.readFileSync;
  fs.readFileSync = function(path, ...args) {
    if (path === '/dev/stdin') {
      throw Object.assign(new Error('ENXIO: cannot reopen stdin'), { code: 'ENXIO' });
    }
    return read.call(this, path, ...args);
  };
  syncBuiltinESMExports();
  await import('./dist/index.js');
`;

function renderWithUnavailableStdinPath(input) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', bootstrap], {
    input,
    encoding: 'utf8',
    timeout: 5000,
  });
}

test('CLI preserves stdin JSON when /dev/stdin cannot be reopened', () => {
  const output = renderWithUnavailableStdinPath(JSON.stringify({
    cwd: '/tmp/cc-fusion-stdin-probe',
    model: { display_name: 'stdin-probe-model' },
    effortLevel: 'low',
    context_window: { used_percentage: 42, context_window_size: 200000 },
  }));
  assert.ok(output.includes('cc-fusion-stdin-probe'));
  assert.ok(output.includes('stdin-probe-model'));
  assert.ok(output.includes('low'));
  assert.ok(output.includes('42.0%'));
});

test('CLI still tolerates empty and malformed stdin', () => {
  for (const input of ['', '{invalid']) {
    const output = renderWithUnavailableStdinPath(input);
    assert.ok(output.includes('Unknown'));
    assert.ok(output.includes('--.-%'));
  }
});
