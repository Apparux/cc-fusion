import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { renderLine1 } from '../dist/lines/line1.js';
import { calcContextPct, getContextTokens, getContextWindowSize } from '../dist/stdin.js';
import { findTranscript, parseTranscript } from '../dist/transcript.js';

const ANSI = {
  reset: '\x1b[0m',
  blink: '\x1b[5m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  brightBlue: '\x1b[94m',
  lightPurple: '\x1b[38;5;141m',
  deepPurple: '\x1b[38;5;93m',
  gray: '\x1b[38;5;240m',
  pink: '\x1b[38;5;213m',
};

function stripAnsi(text) {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function renderCli(stdin, env = process.env) {
  return execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify(stdin),
      encoding: 'utf8',
      env,
    }
  );
}

function firstLine(output) {
  return output.split('\n', 1)[0];
}

function firstLineParts(output) {
  return stripAnsi(firstLine(output)).split('  |  ').map((part) => part.trim());
}

test('CLI renders every known effort level with its required ANSI treatment', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-colors-'));
  const staticCases = [
    ['low', ANSI.yellow, 'low'],
    ['medium', ANSI.blue, 'medium'],
    ['high', ANSI.brightBlue, 'high'],
    ['ultra', ANSI.deepPurple, 'ultracode'],
    ['ultracode', ANSI.deepPurple, 'ultracode'],
  ];

  for (const [input, color, display] of staticCases) {
    const line = firstLine(renderCli({
      model: { display_name: 'Opus 4.7' },
      cwd,
      effortLevel: input,
    }));

    assert.ok(
      line.endsWith(`${color}🧿 ${display}${ANSI.reset}`),
      `${input} should render as ${display} with ${JSON.stringify(color)}`
    );
  }

  const xhighLine = firstLine(renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effortLevel: 'xhigh',
  }));
  assert.ok(xhighLine.endsWith(`${ANSI.lightPurple}🧿 xhigh${ANSI.reset}`));

  const maxLine = firstLine(renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effortLevel: 'max',
  }));
  assert.ok(maxLine.endsWith(
    `${ANSI.green}🧿 m${ANSI.brightBlue}a${ANSI.lightPurple}x${ANSI.reset}`
  ));
  assert.equal(stripAnsi(maxLine).split('  |  ').at(-1).trim(), '🧿 max');
});

test('renderLine1 keeps xhigh and max static over time without ANSI blink', () => {
  const renderEffort = (level) => renderLine1({
    stdin: { effort: { level } },
    git: null,
    tools: { agents: [], todos: [], totalTodos: 0, doneTodos: 0 },
    model: 'Opus 4.7',
    project: 'project',
    contextPct: null,
    contextUsed: '--',
    contextTotal: '--',
  });
  const originalDateNow = Date.now;

  try {
    Date.now = () => 0;
    const xhighFirst = renderEffort('xhigh');
    const maxFirst = renderEffort('max');

    Date.now = () => 300;
    const xhighSecond = renderEffort('xhigh');
    const maxSecond = renderEffort('max');

    assert.equal(xhighFirst, xhighSecond);
    assert.ok(xhighFirst.endsWith(`${ANSI.lightPurple}🧿 xhigh${ANSI.reset}`));

    const staticMax = `${ANSI.green}🧿 m${ANSI.brightBlue}a${ANSI.lightPurple}x${ANSI.reset}`;
    assert.equal(maxFirst, maxSecond);
    assert.ok(maxFirst.endsWith(staticMax));
    assert.equal(firstLineParts(maxFirst).at(-1), '🧿 max');

    for (const line of [xhighFirst, xhighSecond, maxFirst, maxSecond]) {
      assert.equal(line.includes(ANSI.blink), false);
      assert.ok(line.endsWith(ANSI.reset));
    }
  } finally {
    Date.now = originalDateNow;
  }
});

test('CLI keeps static effort labels readable and reset at the line boundary', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-static-'));
  const cases = [
    ['xhigh', '🧿 xhigh'],
    ['max', '🧿 max'],
  ];

  for (const [level, plainLabel] of cases) {
    const output = renderCli({
      model: { display_name: 'Opus 4.7' },
      cwd,
      effortLevel: level,
    });
    const line = firstLine(output);

    assert.equal(firstLineParts(output).at(-1), plainLabel);
    assert.equal(line.includes(ANSI.blink), false);
    assert.ok(line.endsWith(ANSI.reset));
    assert.ok(output.includes(`${ANSI.reset}\n${ANSI.pink}🧠 Context`));
  }
});

test('CLI normalizes camelCase and snake_case effort fields with valid camelCase priority', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-input-'));

  const camelWins = renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effortLevel: '  HIGH  ',
    effort_level: 'low',
  });
  assert.equal(firstLineParts(camelWins).at(-1), '🧿 high');
  assert.ok(firstLine(camelWins).endsWith(`${ANSI.brightBlue}🧿 high${ANSI.reset}`));

  const snakeCase = renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effort_level: '  MeDiUm  ',
  });
  assert.equal(firstLineParts(snakeCase).at(-1), '🧿 medium');
  assert.ok(firstLine(snakeCase).endsWith(`${ANSI.blue}🧿 medium${ANSI.reset}`));

  const invalidCamelFallsBack = renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effortLevel: 42,
    effort_level: ' low ',
  });
  assert.equal(firstLineParts(invalidCamelFallsBack).at(-1), '🧿 low');
});

test('CLI prefers current effort schema and falls back through effort environment variables', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-current-'));
  const baseStdin = {
    model: { display_name: 'Opus 4.7' },
    cwd,
  };
  const effortEnv = {
    ...process.env,
    CLAUDE_EFFORT: 'medium',
    CLAUDE_CODE_EFFORT_LEVEL: 'max',
  };

  const currentSchema = renderCli({
    ...baseStdin,
    effort: { level: ' XHIGH ' },
    effortLevel: 'low',
  }, effortEnv);
  assert.equal(firstLineParts(currentSchema).at(-1), '🧿 xhigh');

  const currentTurnEnv = renderCli(baseStdin, effortEnv);
  assert.equal(firstLineParts(currentTurnEnv).at(-1), '🧿 medium');

  const configuredEnv = renderCli(baseStdin, {
    ...effortEnv,
    CLAUDE_EFFORT: ' ',
    CLAUDE_CODE_EFFORT_LEVEL: 'HIGH',
  });
  assert.equal(firstLineParts(configuredEnv).at(-1), '🧿 high');
});

test('CLI gives a valid unknown camelCase effort priority and renders it gray', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-unknown-'));
  const output = renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd,
    effortLevel: '  Future-Mode  ',
    effort_level: 'max',
  });

  assert.equal(firstLineParts(output).at(-1), '🧿 future-mode');
  assert.ok(firstLine(output).endsWith(`${ANSI.gray}🧿 future-mode${ANSI.reset}`));
  assert.doesNotMatch(stripAnsi(firstLine(output)), /🧿 max/);
});

test('CLI hides missing, empty, and non-string effort values without a dangling separator', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-invalid-'));
  const invalidInputs = [
    {},
    { effortLevel: '' },
    { effortLevel: '   ' },
    { effortLevel: null },
    { effortLevel: 7 },
    { effortLevel: false },
    { effortLevel: ['high'] },
    { effortLevel: { level: 'high' } },
    { effortLevel: ' ', effort_level: '' },
  ];

  const noEffortEnv = {
    ...process.env,
    CLAUDE_EFFORT: '',
    CLAUDE_CODE_EFFORT_LEVEL: '',
  };

  for (const effortFields of invalidInputs) {
    const output = renderCli({
      model: { display_name: 'Opus 4.7' },
      cwd,
      ...effortFields,
    }, noEffortEnv);
    const line = firstLine(output);

    assert.deepEqual(firstLineParts(output), ['👾 Opus 4', `🗃️ ${cwd.split('/').at(-1)}`]);
    assert.doesNotMatch(stripAnsi(line), /🧿/);
    assert.doesNotMatch(stripAnsi(line), /\|\s*$/);
  }
});

test('CLI places effort after Git, or directly after Project outside Git', () => {
  const gitProject = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-git-'));
  execFileSync('git', ['init', '-q', '-b', 'effort-branch'], { cwd: gitProject });
  execFileSync(
    'git',
    ['-c', 'user.name=CC Fusion Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-q', '-m', 'init'],
    { cwd: gitProject }
  );

  const gitParts = firstLineParts(renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd: gitProject,
    effortLevel: 'high',
  }));
  assert.deepEqual(gitParts.slice(-2), ['🫯 effort-branch 🎯', '🧿 high']);

  const plainProject = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-no-git-'));
  const plainParts = firstLineParts(renderCli({
    model: { display_name: 'Opus 4.7' },
    cwd: plainProject,
    effortLevel: 'high',
  }));
  assert.deepEqual(plainParts.slice(-2), [`🗃️ ${plainProject.split('/').at(-1)}`, '🧿 high']);
  assert.equal(plainParts.some((part) => part.startsWith('🫯 ')), false);
});

test('CLI renders the current effort on every consecutive LEVEL switch', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cc-fusion-effort-switch-'));
  const switches = [
    ['low', 'low'],
    ['MAX', 'max'],
    [' ultra ', 'ultracode'],
    ['xhigh', 'xhigh'],
    ['medium', 'medium'],
  ];

  for (const [input, expected] of switches) {
    const output = renderCli({
      model: { display_name: 'Opus 4.7' },
      cwd,
      effortLevel: input,
    });
    assert.equal(firstLineParts(output).at(-1), `🧿 ${expected}`);
  }
});

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

function writeTrellisTask(projectDir, taskName, title, status = 'in_progress') {
  const taskDir = join(projectDir, '.trellis', 'tasks', taskName);
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, 'task.json'), JSON.stringify({ title, status }));
  return `.trellis/tasks/${taskName}`;
}

function writeTrellisSession(projectDir, fileName, currentTask) {
  const sessionsDir = join(projectDir, '.trellis', '.runtime', 'sessions');
  mkdirSync(sessionsDir, { recursive: true });
  writeFileSync(join(sessionsDir, fileName), JSON.stringify({ current_task: currentTask }));
}

test('CLI falls back to Trellis active task when transcript has no todos', () => {
  const project = mkdtempSync(join(tmpdir(), 'cc-fusion-trellis-project-'));
  const taskRef = writeTrellisTask(project, '06-19-statusline-display', '兼容显示 Trellis 任务到状态栏', 'in_progress');
  writeTrellisSession(project, 'claude_trellis-session.json', taskRef);

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        session_id: 'trellis-session',
        cwd: project,
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /⚡ Trellis 兼容显示 Trellis 任务到状态栏/);
  assert.match(output, /in_progress/);
  assert.doesNotMatch(output, /无待办任务/);
});

test('CLI maps Trellis planning and completed statuses to task icons', () => {
  const renderTrellisProject = (status) => {
    const project = mkdtempSync(join(tmpdir(), `cc-fusion-trellis-${status}-`));
    const taskRef = writeTrellisTask(project, `06-19-${status}`, `${status} task`, status);
    writeTrellisSession(project, `claude_${status}-session.json`, taskRef);

    return execFileSync(
      process.execPath,
      ['dist/index.js'],
      {
        input: JSON.stringify({
          model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
          session_id: `${status}-session`,
          cwd: project,
        }),
        encoding: 'utf8',
      }
    );
  };

  const planningOutput = renderTrellisProject('planning');
  assert.match(planningOutput, /⏳ Trellis planning task/);
  assert.match(planningOutput, /planning/);

  const completedOutput = renderTrellisProject('completed');
  assert.match(completedOutput, /✅ Trellis completed task/);
  assert.match(completedOutput, /completed/);
});

test('CLI keeps Claude transcript todos ahead of Trellis fallback', () => {
  const project = mkdtempSync(join(tmpdir(), 'cc-fusion-trellis-priority-'));
  const transcript = join(project, 'transcript.jsonl');
  const taskRef = writeTrellisTask(project, '06-19-statusline-display', 'Trellis fallback should not render', 'in_progress');
  writeTrellisSession(project, 'claude_trellis-priority.json', taskRef);
  writeFileSync(transcript, [
    JSON.stringify({ type: 'tool_use', id: 'task-create-1', name: 'TaskCreate', input: { taskId: 1, subject: 'Claude todo wins' } }),
    JSON.stringify({ type: 'tool_use', id: 'task-update-1', name: 'TaskUpdate', input: { taskId: 1, status: 'in_progress' } }),
  ].join('\n'));

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        session_id: 'trellis-priority',
        transcript_path: transcript,
        cwd: project,
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /⚡ 1\/1 Claude todo wins/);
  assert.match(output, /0%/);
  assert.doesNotMatch(output, /Trellis fallback should not render/);
});

test('CLI degrades to no todos for stale Trellis active task pointer', () => {
  const project = mkdtempSync(join(tmpdir(), 'cc-fusion-trellis-stale-'));
  writeTrellisSession(project, 'claude_trellis-stale.json', '.trellis/tasks/missing-task');

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        session_id: 'trellis-stale',
        cwd: project,
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /无待办任务/);
  assert.doesNotMatch(output, /Trellis/);
});

test('CLI degrades to no todos for bad Trellis task JSON', () => {
  const project = mkdtempSync(join(tmpdir(), 'cc-fusion-trellis-bad-json-'));
  const taskDir = join(project, '.trellis', 'tasks', '06-19-bad-json');
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, 'task.json'), '{ bad json');
  writeTrellisSession(project, 'claude_trellis-bad-json.json', '.trellis/tasks/06-19-bad-json');

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        session_id: 'trellis-bad-json',
        cwd: project,
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /无待办任务/);
  assert.doesNotMatch(output, /Trellis/);
});

test('CLI does not guess Trellis active task when multiple sessions exist without exact match', () => {
  const project = mkdtempSync(join(tmpdir(), 'cc-fusion-trellis-multiple-'));
  const taskRef = writeTrellisTask(project, '06-19-multiple-session', 'Multiple session task', 'in_progress');
  writeTrellisSession(project, 'claude_other-a.json', taskRef);
  writeTrellisSession(project, 'claude_other-b.json', taskRef);

  const output = execFileSync(
    process.execPath,
    ['dist/index.js'],
    {
      input: JSON.stringify({
        model: { display_name: 'Opus 4.7', id: 'claude-opus-4-7' },
        cwd: project,
      }),
      encoding: 'utf8',
    }
  );

  assert.match(output, /无待办任务/);
  assert.doesNotMatch(output, /Multiple session task/);
});
