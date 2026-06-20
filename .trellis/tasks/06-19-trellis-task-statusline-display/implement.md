# Implementation Plan: Trellis Task Fallback in Tasks Line

## Development Strategy

- Development mode: current Claude Code session.
- Workspace: current `main` branch; no separate worktree planned.
- Approach: regression-test-backed implementation with a small new Trellis reader module.
- Keep changes local to statusline data collection/rendering and tests.

## Review Gate Order

1. `trellis-spec-review`
2. `trellis-code-review`
3. `trellis-code-architecture-review`

## Ordered Checklist

1. Confirm current git state is clean or only contains this task's planning files.
2. Add/extend shared task item type in `src/types.ts` so Trellis fallback can carry an optional raw status label without disturbing transcript todos.
3. Add a focused Trellis reader module, likely `src/trellis.ts`, that:
   - finds `.trellis` from `cwd` upward;
   - reads `.trellis/.runtime/sessions/*.json` directly;
   - prefers `claude_<sessionId>.json` when `stdin.session_id` / `stdin.sessionId` exists;
   - falls back only when exactly one session file exists;
   - resolves `current_task` to an existing non-archive task directory;
   - reads `task.json` defensively;
   - maps Trellis `status` to existing task visual statuses.
4. Integrate fallback in `src/index.ts` after `parseTranscript`:
   - preserve transcript todos when present;
   - merge only when `tools.todos.length === 0` and Trellis fallback exists;
   - keep activity fields unchanged.
5. Update `src/lines/line4.ts` to render optional `statusLabel` as a separate segment after the task item, enabling `Trellis <title> | in_progress` without affecting normal Todo items.
6. Add regression tests in `test/regression.test.mjs` for:
   - no transcript todos + Trellis active task → Tasks line includes `Trellis <title>` and raw status;
   - transcript Todo exists + Trellis active task also exists → Claude Todo wins;
   - stale active task pointer / unreadable bad JSON → `无待办任务` remains;
   - optional: multiple runtime session files without exact session id does not guess.
7. Run `npm test`.
8. Run `git diff --check`.
9. Run targeted CLI smoke test with temporary project/cwd, `.trellis/.runtime/sessions/claude_<session>.json`, task `task.json`, and stdin containing matching `session_id`/`cwd`.
10. Run review gates in order and fix blocking findings.

## Validation Commands

- `npm test`
- `git diff --check`
- Targeted smoke test with temp `.trellis` runtime and stdin:
  - expect `💤 Tasks` line to contain `Trellis <title>` and `in_progress`.
- Existing transcript Todo smoke/test:
  - expect Claude Todo display remains unchanged and Trellis fallback is absent.

## Risk and Rollback Points

- `src/index.ts`: fallback must not overwrite transcript Todo data.
- `src/trellis.ts`: active session fallback must avoid guessing across multiple sessions.
- `src/lines/line4.ts`: added status label segment must not change normal Todo percentage layout.
- Rollback: revert `src/trellis.ts`, type/renderer/index changes, and tests from this task.

## Notes for Implementation

- Do not hand-edit `dist/`; let `npm test` / `npm run build` regenerate it.
- Do not add runtime dependencies.
- Do not print debug logs from statusline runtime.
- Keep Trellis file parsing bounded to small runtime/task JSON files.
