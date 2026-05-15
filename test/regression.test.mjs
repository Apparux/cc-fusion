import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { calcContextPct, getContextTokens, getContextWindowSize } from '../dist/stdin.js';
import { findTranscript, parseTranscript } from '../dist/transcript.js';

test('legacy top-level context fields produce percentage and token totals', () => {
  const stdin = {
    input_tokens: 25_000,
    output_tokens: 5_000,
    max_context_window_size: 100_000,
  };

  assert.equal(getContextWindowSize(stdin), 100_000);
  assert.equal(getContextTokens(stdin).total, 30_000);
  assert.equal(calcContextPct(stdin), 30);
});

test('current context_window fields preserve direct percentage and total token display', () => {
  const stdin = {
    context_window: {
      used_percentage: 59.9,
      context_window_size: 200_000,
      total_input_tokens: 76_000,
      total_output_tokens: 12_000,
      current_usage: {
        input_tokens: 28_000,
        output_tokens: 12_000,
        cache_creation_input_tokens: 8_000,
        cache_read_input_tokens: 40_000,
      },
    },
  };

  assert.equal(getContextWindowSize(stdin), 200_000);
  assert.deepEqual(getContextTokens(stdin), {
    input: 28_000,
    output: 12_000,
    cacheCreate: 8_000,
    cacheRead: 40_000,
    total: 88_000,
  });
  assert.equal(calcContextPct(stdin), 59.9);
});

test('transcript discovery prefers valid explicit path and parses transcript stats', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-transcript-'));
  const explicit = join(dir, 'explicit.jsonl');
  writeFileSync(explicit, [
    JSON.stringify({ type: 'tool_use', id: 'read-1', name: 'Read', input: { file_path: '/tmp/source.ts' } }),
    JSON.stringify({ type: 'tool_use', id: 'edit-1', name: 'Edit', input: { file_path: '/tmp/source.ts' } }),
  ].join('\n'));

  assert.equal(findTranscript('session-a', '/tmp/project', explicit), explicit);
  const stats = parseTranscript(explicit);
  assert.equal(stats.lastRead, '/tmp/source.ts');
  assert.equal(stats.lastEdit, '/tmp/source.ts');
});

test('transcript discovery falls back to inferred Claude project path', () => {
  const home = mkdtempSync(join(tmpdir(), 'cc-fusion-home-'));
  const previousHome = process.env.HOME;
  process.env.HOME = home;

  try {
    const cwd = '/tmp/project';
    const sessionId = 'session-b';
    const transcriptDir = join(home, '.claude', 'projects', 'tmp-project');
    const inferred = join(transcriptDir, `${sessionId}.jsonl`);
    mkdirSync(transcriptDir, { recursive: true });
    writeFileSync(inferred, JSON.stringify({ type: 'tool_use', id: 'grep-1', name: 'Grep', input: { pattern: 'needle' } }));

    assert.equal(findTranscript(sessionId, cwd, join(home, 'missing.jsonl')), inferred);
    assert.equal(parseTranscript(inferred).lastSearch, 'needle');
  } finally {
    if (previousHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousHome;
    }
  }
});

test('CLI uses inferred transcript path when transcript_path is absent', () => {
  const home = mkdtempSync(join(tmpdir(), 'cc-fusion-cli-home-'));
  const cwd = '/tmp/project';
  const sessionId = 'session-cli';
  const transcriptDir = join(home, '.claude', 'projects', 'tmp-project');
  mkdirSync(transcriptDir, { recursive: true });
  writeFileSync(
    join(transcriptDir, `${sessionId}.jsonl`),
    JSON.stringify({ type: 'tool_use', id: 'read-cli', name: 'Read', input: { file_path: '/tmp/project/src/index.ts' } })
  );

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        session_id: sessionId,
        cwd,
        input_tokens: 10_000,
        output_tokens: 5_000,
        max_context_window_size: 100_000,
      }),
      env: { ...process.env, HOME: home },
      encoding: 'utf8',
    }
  );

  assert.match(output, /15\.0k \/ 100\.0k tokens/);
  assert.match(output, /Read src\/index\.ts/);
});
