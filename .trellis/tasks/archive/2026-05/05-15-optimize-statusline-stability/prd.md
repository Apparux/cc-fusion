# Optimize statusline stability and compatibility

## Goal

Improve CC-Fusion statusline correctness and regression safety by tightening existing input/transcript compatibility paths and adding focused automated verification, without changing the accepted visual direction or introducing broad refactors.

## Requirements

- Use the existing transcript discovery capability when `transcript_path` is absent or invalid, so Activity/Tasks/Agents can still be populated from known Claude Code transcript locations when `session_id` and `cwd` are available.
- Centralize context token and context window size compatibility in `src/stdin.ts`; runtime rendering should not duplicate schema-specific token math in `src/index.ts`.
- Preserve support for current Claude Code context fields: `context_window.used_percentage`, `context_window.context_window_size`, `context_window.current_usage`, `total_input_tokens`, and `total_output_tokens`.
- Preserve or add support for legacy fields referenced by project guidance: `input_tokens` and `max_context_window_size`.
- Add a minimal regression test path using Node's built-in test runner and TypeScript compilation output; avoid new runtime dependencies.
- Cover at least stdin context compatibility and transcript discovery/parsing behavior with tests or focused fixtures.
- Keep statusline stdout clean: no debug logs, no extra stdout outside rendered statusline or CLI command output.
- Keep changes surgical. Do not change visual icons, colors, line layout, or unrelated renderer behavior.

## Acceptance Criteria

- [ ] `src/index.ts` uses transcript path discovery instead of passing only `stdin.transcript_path` directly to `parseTranscript`.
- [ ] Context used/total display uses compatibility helpers from `src/stdin.ts` rather than duplicate direct field reads in `src/index.ts`.
- [ ] Legacy top-level context fields can produce a non-zero context percentage and token display when no `context_window` object is present.
- [ ] Current `context_window.current_usage` and total token fields still render correctly.
- [ ] Transcript discovery handles explicit path first and inferred Claude project path when possible.
- [ ] Tests run locally without adding runtime dependencies.
- [ ] `npm run build` passes.
- [ ] Targeted stdin smoke tests pass after build.
- [ ] `git diff --check` passes.
- [ ] `npm pack --dry-run` passes.

## Definition of Done

- TypeScript build succeeds.
- Automated tests or test-equivalent fixtures cover the changed compatibility paths.
- At least one rendered statusline smoke test verifies no-argument CLI output remains valid.
- Package preview succeeds.
- No generated or local harness files are committed unintentionally.

## Technical Approach

- Extend `StdinData`/helpers in `src/stdin.ts` as the single source of truth for context token/window compatibility.
- Import and use `findTranscript()` in `src/index.ts`, using whichever session identifier field the Claude Code stdin provides.
- Add a lightweight test script based on `node --test` against compiled `dist` output, keeping the implementation dependency-free.
- Keep transcript parser behavior tolerant: unreadable paths and malformed JSONL still degrade to empty stats.

## Decision (ADR-lite)

**Context**: The review found existing helper logic that was either duplicated or not wired into the entry path. Because this CLI runs as a statusline renderer, correctness and bounded failure behavior matter more than architectural expansion.

**Decision**: Implement focused compatibility fixes and minimal regression tests first. Defer larger git/transcript performance changes until measurement shows a real bottleneck.

**Consequences**: The change stays low-risk and easier to verify, but it does not attempt to redesign statusline rendering, config/theme behavior, or transcript performance in this task.

## Out of Scope

- Changing visual design, icons, colors, labels, or row layout.
- Adding external runtime dependencies.
- Cross-platform build script redesign unless directly required for tests.
- Releasing to npm in this task unless explicitly requested later.
- Broad performance rewrites for git/transcript collection without measurement.
- Modifying project documentation except Trellis task artifacts required by workflow.

## Technical Notes

- `CLAUDE.md` states `src/index.ts` owns command dispatch and must keep command handling before stdin reads.
- `CLAUDE.md` and `.trellis/spec/backend/quality-guidelines.md` require context-window compatibility to be centralized in `src/stdin.ts`.
- `.trellis/spec/backend/error-handling.md` requires optional git/transcript/config failures to degrade safely rather than crash normal statusline rendering.
- Existing `src/transcript.ts` already provides `findTranscript(sessionId, cwd, explicitPath)`.
- Existing `src/stdin.ts` already provides `getContextTokens()` and `calcContextPct()`, but `src/index.ts` currently duplicates token math.
