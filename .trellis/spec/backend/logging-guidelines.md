# Logging Guidelines

> How logging is done in this project.

---

## Overview

This project does not use a logging library. As a statusline CLI, normal output is the rendered statusline on stdout. Extra logging would corrupt Claude Code statusline rendering, so runtime diagnostics are intentionally minimal.

---

## Output Channels

- `process.stdout.write` is used for intentional user output:
  - rendered statusline in `src/index.ts`
  - help/version output in `src/index.ts`
  - guided setup prompts and summaries in `src/configure.ts`
- `process.stderr.write` is used for command/runtime errors:
  - unknown command in `src/index.ts`
  - top-level `cc-fusion failed: ...` in `src/index.ts`
- `scripts/postinstall.js` uses `console.log` because it is an npm lifecycle informational script, not the statusline runtime.

---

## Log Levels

There are no debug/info/warn/error levels. Do not add level-based logging to statusline execution without a product requirement and a way to keep stdout clean.

---

## What to Log or Print

- Print only the final statusline during no-argument execution.
- Print interactive prompts and setup instructions only during explicit commands such as `cc-fusion configure`.
- Print concise, actionable errors for invalid commands and unexpected top-level failures.

---

## What NOT to Log

- Do not print debug traces, parsed stdin, transcript contents, config contents, token payloads, file paths from user config, or environment variables during normal statusline rendering.
- Do not log secrets, npm tokens, GitHub tokens, user home-directory config bodies, or raw Claude transcript message content.
- Do not use `console.log` in `src/` runtime modules; prefer explicit `process.stdout.write`/`process.stderr.write` so output behavior is clear.

---

## Common Mistakes

- Adding debug output to `src/render.ts`, `src/stdin.ts`, or renderer modules will become visible in the statusline and should be avoided.
- Do not convert recoverable fallbacks into warnings printed on every statusline refresh.
