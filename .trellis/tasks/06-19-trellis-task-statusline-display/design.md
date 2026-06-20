# Technical Design: Trellis Task Fallback in Tasks Line

## Problem Restatement

When Claude Code does not emit `TaskCreate` / `TaskUpdate` events, cc-fusion has no transcript-derived Todo data and shows `无待办任务`, even though Trellis may have a session active task.

## Fundamental Truths

- The statusline renderer can only show task progress if its render context contains task data.
- Claude Code Todo and Trellis Task are different systems; Claude Todo can be multiple items with counts, Trellis active task is normally one project task.
- Statusline execution is frequent and should remain fast, local, bounded, and quiet.
- Missing optional data must degrade to existing empty/default display rather than crash.
- The user wants Trellis fallback to be visually distinguishable from Claude Code Todo.

## Architecture and Boundaries

### Existing flow

`src/index.ts` currently performs:

1. parse stdin
2. resolve cwd/session/transcript
3. parse transcript into `ToolStats`
4. render fixed statusline lines

`src/transcript.ts` owns Claude transcript parsing and should continue to own only transcript-derived activity/Todo aggregation.

### Proposed boundary

Add a focused Trellis reader module, e.g. `src/trellis.ts`, responsible for:

- discovering `.trellis` from the current `cwd` upward;
- reading `.trellis/.runtime/sessions/*.json` directly;
- resolving a session active task pointer when possible;
- reading the active task `task.json`;
- mapping that one Trellis task into a small data shape usable by the Tasks line.

Do not call `python3 ./.trellis/scripts/task.py current` from statusline runtime.

## Data Flow

1. `src/index.ts` calls `parseTranscript(transcriptPath)` as today.
2. If `tools.todos.length > 0`, keep transcript results unchanged.
3. If `tools.todos.length === 0`, call Trellis fallback reader with `cwd` and optionally the parsed stdin/session data.
4. If a Trellis active task is found and its `task.json` is readable:
   - create a display item with name `Trellis <task.title>`;
   - keep the raw Trellis status string available for display;
   - map Trellis status to the existing Todo visual status class.
5. `src/lines/line4.ts` renders fallback as:

```text
💤 Tasks  |  ⚡ Trellis <title>  |  in_progress
```

6. If no valid Trellis fallback exists, keep existing `无待办任务` behavior.

## Active Task Resolution Contract

The reader should mirror the minimum safe subset of Trellis active-task behavior without importing/running Python:

- Find repo root by walking upward from `cwd` until `.trellis/` exists.
- Look under `.trellis/.runtime/sessions/*.json`.
- Prefer exact current session file if `stdin.session_id` or `stdin.sessionId` can derive `claude_<sessionId>.json`.
- Otherwise, only use fallback if exactly one session file exists, matching Trellis' refusal to guess across multiple sessions.
- Read `current_task` from the session JSON.
- Resolve `current_task` as repo-relative path; require it to point inside an existing active `.trellis/tasks/...` directory, not archive.
- Read `task.json`; require a non-empty string `title` and string `status`.

If any step fails, return no fallback.

## Display Contract

- Claude Code Todo keeps existing display and percentage behavior.
- Trellis fallback is single-task display only.
- Trellis fallback does not display a fabricated percentage.
- Display text includes source prefix `Trellis` and raw status as a separate segment.
- Status icon/color mapping:
  - `completed` / `done` → `done` → ✅ / green
  - `in_progress` / `current` → `current` → ⚡ / yellow
  - `planning` / `pending` → `pending` → ⏳ / dim
  - unknown statuses → `future` → 🕒 / dim

## Type Contract

Extend shared task item typing in `src/types.ts` rather than duplicating shapes across modules. A minimal extension can add an optional field to todo items, for example:

```ts
source?: 'claude' | 'trellis';
statusLabel?: string;
```

Existing transcript-generated todos do not need to set these fields. Trellis fallback can set `source: 'trellis'` and `statusLabel: task.status`.

`src/lines/line4.ts` can then render `statusLabel` only when present.

## Compatibility Notes

- Existing transcript tests and display behavior must remain unchanged.
- Trellis absence must be invisible for non-Trellis projects.
- Bad or stale `.trellis` runtime files must not crash statusline execution.
- No stdout/stderr diagnostics from normal statusline rendering.
- No new runtime dependencies.

## Trade-offs

- Directly reading `.trellis/.runtime` duplicates a small subset of Trellis active-task resolution, but avoids statusline latency and subprocess noise.
- Showing one Trellis task sacrifices detailed checklist progress, but avoids misleading percentages.
- Session matching via `claude_<sessionId>.json` may miss exotic context-key cases; single-session fallback covers common local use while avoiding multi-window cross-contamination.

## Rollback Shape

The change should be localized to:

- new `src/trellis.ts` or equivalent small module;
- small integration in `src/index.ts`;
- optional type extension in `src/types.ts`;
- small renderer handling in `src/lines/line4.ts`;
- regression tests in `test/regression.test.mjs`.

Rollback is reverting those localized changes.
