# State Management

> How state is managed in this project.

---

## Overview

There is no client-side state library, global store, URL state, or server-state cache. CC-Fusion computes a render context for each CLI invocation from current inputs and writes output once.

---

## State Categories

- Effective configuration: loaded and merged by `loadConfig` in `src/config.ts` from defaults, package/project/user config, and `CC_FUSION_CONFIG`.
- Theme and preset state: loaded by `loadTheme` and `loadPreset` from user overrides first, then built-ins.
- Invocation state: stdin JSON, git info, transcript stats, model/dir/context/cost/duration fields assembled into `RenderContext` in `src/index.ts`.
- Interactive configuration state: local variables inside `runConfigureCommand` in `src/configure.ts`, persisted only when writing user `config.json`.

---

## When to Use Global State

Do not add global mutable state for normal features. Existing modules use constants for defaults and registries, such as `DEFAULT_CONFIG`, default theme colors/icons, built-in `PRESETS`, and `ELEMENT_RENDERERS`.

If a value depends on stdin, cwd, user config, or transcript contents, pass it through function parameters or `RenderContext` instead of module-level mutation.

---

## Server State

Not applicable. There is no server. Git and transcript data are local snapshots read during one invocation.

---

## Derived State

Derived display values are computed close to where they are used:

- `src/index.ts` derives `model`, `dir`, `contextPct`, `usagePct`, `costUsd`, `duration`, and `effort` before building `RenderContext`.
- `src/stdin.ts` derives normalized token totals and percentages from multiple possible Claude Code schema shapes.
- Renderer modules derive visibility by returning `null` when an element should be hidden, as in `renderUsage` and `renderCost`.

---

## Common Mistakes

- Do not cache invocation-specific data across CLI runs in module globals.
- Do not add Redux/Zustand/MobX or similar state libraries.
- Do not make renderer modules read config files directly; pass loaded config/theme/i18n through the render pipeline.
