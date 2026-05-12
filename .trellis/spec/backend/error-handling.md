# Error Handling

> How errors are handled in this project.

---

## Overview

CC-Fusion favors resilient CLI behavior: missing optional data should usually degrade to an empty/default display rather than crash the statusline. User-invoked CLI failures should write a concise message to stderr and set a non-zero exit code.

There are no custom error classes in the current codebase.

---

## Error Types

- No domain-specific `Error` subclasses are defined.
- Functions return `null`, empty objects, empty strings, or default values when optional inputs are absent or unreadable.
- Top-level unexpected errors are handled in `src/index.ts` by `main().catch(...)`, which writes `cc-fusion failed: <message>` to stderr and sets `process.exitCode = 1`.

---

## Error Handling Patterns

Follow existing patterns from real files:

- `src/stdin.ts`: `parseStdin` catches invalid JSON and returns `{}` so statusline rendering can continue with defaults.
- `src/config.ts`: `readConfigFile` catches parse/read errors and returns `null`; `loadTheme` and `loadPreset` fall back to default built-ins when user/package files are absent or invalid.
- `src/git.ts`: command failures are contained in a local `exec` helper that returns `''`; `getGitInfo` returns `null` outside git repositories.
- `src/transcript.ts`: malformed JSONL lines are skipped; outer parsing failures return `emptyStats()`.
- `src/configure.ts`: invalid interactive choices are re-prompted with explicit messages such as `Invalid choice...`, `Enter yes or no.`, or `Enter a whole number...`.

---

## CLI Error Responses

- Unknown commands are handled in `src/index.ts`: write `Unknown command: <command>` plus help to stderr/stdout, set `process.exitCode = 1`, and return.
- Top-level unhandled failures should not throw raw stacks by default; preserve the current concise stderr format unless debugging requirements change.
- Interactive `configure` should explain recoverable issues to stdout and return without throwing, as it does for invalid existing JSON when the user declines overwrite.

---

## Common Mistakes

- Do not scatter stdin shape checks across renderers. Add compatibility helpers to `src/stdin.ts` and call those helpers from renderers.
- Do not let optional git, transcript, theme, preset, or config failures crash normal statusline rendering.
- Do not silently swallow user-actionable command errors at the top level; include enough context in stderr/stdout for the user to fix the command.
- Do not replace bounded fallback behavior with long-running retries in statusline code.
