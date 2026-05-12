# Hook Guidelines

> How hooks are used in this project.

---

## Overview

This project has no React or frontend framework hooks. Do not create `use*` hooks, hook directories, or client-side data fetching hooks.

Shared behavior is implemented as ordinary TypeScript functions.

---

## Custom Hook Patterns

Not applicable. Use existing function patterns instead:

- Compatibility/extraction helpers in `src/stdin.ts` (`getCwd`, `getSessionId`, `extractUsageInfo`).
- Formatting helpers in `src/utils.ts` (`formatDuration`, `formatTokens`, `formatCost`).
- Loader functions in `src/config.ts` (`loadConfig`, `loadTheme`, `loadPreset`).

---

## Data Fetching

There is no browser/server-state fetching layer. Data comes from:

- stdin JSON in `src/index.ts`, parsed by `parseStdin`.
- local files read synchronously in `src/config.ts`, `src/i18n.ts`, and transcript helpers.
- short-timeout git commands in `src/git.ts`.

Keep statusline data collection fast, bounded, and synchronous unless a requirement justifies changing the CLI model.

---

## Naming Conventions

- Do not use `use*` naming unless a future frontend framework is genuinely introduced.
- Name shared functions after what they return or do: `getContextTokens`, `calcUsagePct`, `findTranscript`, `parseTranscript`.

---

## Common Mistakes

- Do not introduce React Query/SWR or browser hook abstractions for local CLI file/process reads.
- Do not hide side effects inside functions that look like pure render helpers.
- Do not create hooks to share formatting logic; use `src/utils.ts` helpers.
