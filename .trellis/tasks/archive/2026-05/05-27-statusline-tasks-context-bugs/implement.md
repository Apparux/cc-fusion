# Implementation Plan: Statusline Tasks and Context Stability

## Development Strategy

- Development mode: current Claude Code session.
- Workspace: current `main` branch, no separate worktree.
- Flow: default implementation with regression tests; not TDD-specific.
- 架构审查：disabled.

## Review Gate Order

1. `trellis-spec-review`
2. `trellis-code-review`
3. `trellis-code-architecture-review`

## Ordered Checklist

1. Inspect current type definitions and decide the smallest shared type change needed for context availability.
2. Update `src/stdin.ts` so context helpers can distinguish real zero from unknown usage/window data.
3. Update `src/index.ts` and `src/lines/line2.ts` to render unknown context placeholders without caching previous values.
4. Update `src/transcript.ts` task aggregation so task events are reconstructed from a broader scan than activity tail parsing.
5. Preserve existing activity parsing behavior for reads, edits, searches, and agents.
6. Add regression tests for:
   - `TaskCreate` without `taskId` followed by creation result and updates.
   - Long transcript where task creates/results fall outside the normal tail window but updates remain visible.
   - Missing context usage with known context window size renders unknown placeholders.
7. Run verification commands and targeted smoke tests.
8. Run review gates in order and fix blocking findings before task activation/finish flow proceeds.

## Validation Commands

- `npm test`
- `git diff --check`
- Targeted CLI smoke test with missing context usage and known `context_window_size` expecting `--.-%` and `-- / 1.0M tokens`.
- Targeted CLI smoke test with a transcript fixture that has older task create/result entries and recent task updates expecting Tasks to render current task state.

## Risk and Rollback Points

- `src/transcript.ts`: broader task-event scanning must remain bounded enough for statusline latency.
- `src/stdin.ts`: context helper changes must keep legacy and current input fields working.
- `src/lines/line2.ts`: placeholder formatting must remain compact and not add logs.
- Rollback: revert the localized code/test changes from this task.
