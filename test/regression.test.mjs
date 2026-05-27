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

test('missing context usage with known window size reports unknown percentage', () => {
  const stdin = {
    context_window: {
      context_window_size: 1_000_000,
    },
  };

  assert.equal(getContextWindowSize(stdin), 1_000_000);
  assert.equal(calcContextPct(stdin), null);
});

test('CLI preserves known context percentage when token usage is missing', () => {
  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        context_window: {
          context_window_size: 1_000_000,
        },
        cwd: '/tmp/project',
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /--\.-%/);
  assert.match(output, /-- \/ 1\.0M tokens/);
  assert.doesNotMatch(output, /0\.0%/);
  assert.doesNotMatch(output, /0 \/ 1\.0M tokens/);
});

test('CLI renders unknown context usage placeholders with unknown window size', () => {
  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        cwd: '/tmp/project',
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /--\.-%/);
  assert.match(output, /-- \/ -- tokens/);
});

test('CLI preserves known context percentage when token usage is missing', () => {
  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        context_window: {
          used_percentage: 60,
          context_window_size: 1_000_000,
        },
        cwd: '/tmp/project',
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /60\.0%/);
  assert.match(output, /-- \/ 1\.0M tokens/);
  assert.doesNotMatch(output, /--\.-%/);
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

test('completed task batch resets when a later task is created', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-batch-'));
  const transcript = join(dir, 'completed-reset.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { taskId: 1, subject: 'First batch task A' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-2', name: 'TaskCreate', input: { taskId: 2, subject: 'First batch task B' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'completed' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-2', name: 'TaskUpdate', input: { taskId: 2, status: 'completed' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-3', name: 'TaskCreate', input: { taskId: 3, subject: 'Second batch task' } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'Second batch task', status: 'pending' },
  ]);
  assert.equal(stats.totalTodos, 1);
  assert.equal(stats.doneTodos, 0);
});

test('unfinished task batch appends later task without reset', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-batch-'));
  const transcript = join(dir, 'unfinished-append.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { taskId: 1, subject: 'Done task' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-2', name: 'TaskCreate', input: { taskId: 2, subject: 'Pending task' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'completed' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-3', name: 'TaskCreate', input: { taskId: 3, subject: 'Appended task' } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'Done task', status: 'done' },
    { id: 2, name: 'Pending task', status: 'pending' },
    { id: 3, name: 'Appended task', status: 'pending' },
  ]);
  assert.equal(stats.totalTodos, 3);
  assert.equal(stats.doneTodos, 1);
});

test('over-five task batch uses full counts and displays active window after completed prefix', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-window-'));
  const transcript = join(dir, 'completed-prefix-window.jsonl');
  const lines = [];

  for (let taskId = 1; taskId <= 9; taskId += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `task-create-${taskId}`, name: 'TaskCreate', input: { taskId, subject: `Task ${taskId}` } }));
  }
  for (let taskId = 1; taskId <= 4; taskId += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `task-update-${taskId}`, name: 'TaskUpdate', input: { taskId, status: 'completed' } }));
  }
  lines.push(JSON.stringify({ type: 'tool_use', id: 'task-update-5', name: 'TaskUpdate', input: { taskId: 5, status: 'in_progress' } }));
  writeFileSync(transcript, lines.join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 5, name: 'Task 5', status: 'current' },
    { id: 6, name: 'Task 6', status: 'pending' },
    { id: 7, name: 'Task 7', status: 'pending' },
    { id: 8, name: 'Task 8', status: 'pending' },
    { id: 9, name: 'Task 9', status: 'pending' },
  ]);
  assert.equal(stats.totalTodos, 9);
  assert.equal(stats.doneTodos, 4);
});

test('over-five task batch displays first five active tasks and preserves full totals', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-window-'));
  const transcript = join(dir, 'first-active-window.jsonl');
  const lines = [];

  for (let taskId = 1; taskId <= 9; taskId += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `task-create-${taskId}`, name: 'TaskCreate', input: { taskId, subject: `Task ${taskId}` } }));
  }
  for (let taskId = 1; taskId <= 2; taskId += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `task-update-${taskId}`, name: 'TaskUpdate', input: { taskId, status: 'completed' } }));
  }
  for (let taskId = 3; taskId <= 7; taskId += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `task-update-${taskId}`, name: 'TaskUpdate', input: { taskId, status: 'in_progress' } }));
  }
  writeFileSync(transcript, lines.join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 3, name: 'Task 3', status: 'current' },
    { id: 4, name: 'Task 4', status: 'current' },
    { id: 5, name: 'Task 5', status: 'current' },
    { id: 6, name: 'Task 6', status: 'current' },
    { id: 7, name: 'Task 7', status: 'current' },
  ]);
  assert.equal(stats.totalTodos, 9);
  assert.equal(stats.doneTodos, 2);
});

test('task create and result in one transcript entry are parsed in order', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-order-'));
  const transcript = join(dir, 'same-entry-order.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'user', message: { content: [
      { type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { subject: 'Same entry task' } },
      { type: 'tool_result', tool_use_id: 'task-create-1', content: 'Task #19 created successfully: Same entry task' },
    ] } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 19, status: 'in_progress' } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'Same entry task', status: 'current' },
  ]);
  assert.equal(stats.totalTodos, 1);
  assert.equal(stats.doneTodos, 0);
});

test('non-task tool result text does not create a task', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-result-'));
  const transcript = join(dir, 'non-task-result-text.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'read-1', name: 'Read', input: { file_path: '/tmp/project/test.ts' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'read-1', content: 'fixture text: Task #17 created successfully: Investigate context bug' }] } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, []);
  assert.equal(stats.totalTodos, 0);
  assert.equal(stats.doneTodos, 0);
});

test('task create result does not duplicate an already parsed task id', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-batch-'));
  const transcript = join(dir, 'task-create-result-dedup.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { taskId: 1, subject: 'First task' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'completed' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-create-1', content: 'Task #1 created successfully' }] } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'First task', status: 'done' },
  ]);
  assert.equal(stats.totalTodos, 1);
  assert.equal(stats.doneTodos, 1);
});

test('delayed task create result does not re-add an old completed batch task', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-batch-'));
  const transcript = join(dir, 'delayed-result-after-reset.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { taskId: 1, subject: 'Old completed task' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'completed' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-2', name: 'TaskCreate', input: { taskId: 2, subject: 'New active task' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-create-1', content: 'Task #1 created successfully: Old completed task' }] } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-2', name: 'TaskUpdate', input: { taskId: 2, status: 'in_progress' } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'New active task', status: 'current' },
  ]);
  assert.equal(stats.totalTodos, 1);
  assert.equal(stats.doneTodos, 0);
});

test('task create without taskId uses tool result id and subject', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-result-'));
  const transcript = join(dir, 'task-create-result-id.jsonl');
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { subject: 'Investigate context bug', description: 'Check context', activeForm: 'Investigating context' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-create-1', content: 'Task #17 created successfully: Investigate context bug' }] } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 17, status: 'in_progress' } }),
  ].join('\n'));

  const stats = parseTranscript(transcript);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'Investigate context bug', status: 'current' },
  ]);
  assert.equal(stats.totalTodos, 1);
  assert.equal(stats.doneTodos, 0);
});

test('task scan reconstructs tasks outside the activity tail window', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cc-fusion-task-long-'));
  const transcript = join(dir, 'long-tail-mismatch.jsonl');
  const lines = [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { subject: 'Older completed task' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-create-1', content: 'Task #1 created successfully: Older completed task' }] } }),
    JSON.stringify({ type: 'tool_use', id: 'task-create-2', name: 'TaskCreate', input: { subject: 'Older active task' } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'task-create-2', content: 'Task #2 created successfully: Older active task' }] } }),
  ];

  for (let i = 0; i < 20; i += 1) {
    lines.push(JSON.stringify({ type: 'tool_use', id: `read-${i}`, name: 'Read', input: { file_path: `/tmp/project/file-${i}.ts` } }));
  }

  lines.push(
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'completed' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-2', name: 'TaskUpdate', input: { taskId: 2, status: 'in_progress' } })
  );
  writeFileSync(transcript, lines.join('\n'));

  const stats = parseTranscript(transcript, 2);
  assert.deepEqual(stats.todos, [
    { id: 1, name: 'Older completed task', status: 'done' },
    { id: 2, name: 'Older active task', status: 'current' },
  ]);
  assert.equal(stats.totalTodos, 2);
  assert.equal(stats.doneTodos, 1);
  assert.equal(stats.lastRead, undefined);
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
