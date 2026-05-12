# Directory Structure

> How backend/CLI code is organized in this project.

---

## Overview

CC-Fusion is a single-package TypeScript CLI, not a web backend. Treat `backend` specs as the authoritative guidance for the Node CLI runtime in `src/`.

The package entrypoint is `dist/index.js`, built from `src/index.ts`. The default no-argument command renders a Claude Code statusline from stdin JSON. Interactive commands (`configure`, `config`, `init`) must be handled before reading statusline stdin.

---

## Directory Layout

```text
src/
├── index.ts       # CLI command dispatch, stdin read, render-context assembly
├── configure.ts   # guided interactive config flow
├── config.ts      # config/theme/preset loading and merging
├── stdin.ts       # Claude Code stdin compatibility helpers
├── transcript.ts  # transcript JSONL tail parsing and aggregation
├── render.ts      # preset element registry and line composition
├── context.ts     # context usage renderer
├── usage.ts       # rate-limit/usage renderer
├── cost.ts        # cost renderer and smart hiding
├── effort.ts      # effort renderer
├── git.ts         # git status collection
├── i18n.ts        # label loading
├── types.ts       # shared interfaces
└── utils.ts       # ANSI, formatting, traffic-light helpers

themes/            # built-in TOML palettes/icons; user overrides live outside repo
presets/           # built-in JSON layout definitions
i18n/              # built-in label JSON
scripts/           # npm lifecycle and uninstall helper scripts
dist/              # generated TypeScript output; do not hand-edit
```

---

## Module Organization

- Keep command handling in `src/index.ts` before any stdin read. Example: `handleCliCommand(process.argv[2])` returns before `readStdin()` for `configure`, `--help`, and `--version`.
- Centralize Claude Code stdin schema compatibility in `src/stdin.ts`. Examples: `getCwd`, `getSessionId`, `getContextTokens`, and `extractUsageInfo` normalize legacy and current fields for renderers.
- Keep configuration and presentation separate. `src/config.ts` loads/merges config, themes, and presets; `src/render.ts` maps element names to renderer functions; individual renderer modules own display semantics.
- Put shared interfaces in `src/types.ts`; use local interfaces for module-specific options, such as `ContextRenderOptions` in `src/context.ts` and `UsageRenderOptions` in `src/usage.ts`.
- Put low-level formatting and ANSI helpers in `src/utils.ts`, not inside renderers unless the behavior is specific to one element.

---

## Naming Conventions

- Source files use lowercase kebab-free names matching their domain: `stdin.ts`, `transcript.ts`, `configure.ts`.
- Exported functions are descriptive verbs or verb phrases: `loadConfig`, `renderUsage`, `parseTranscript`, `calcContextPct`.
- Type/interface names are PascalCase and usually live in `src/types.ts`: `StdinData`, `RenderContext`, `ToolStats`.
- Built-in assets use simple stable names consumed by config: `themes/cometix.toml`, `presets/full.json`, `i18n/en.json`.

---

## Examples

- `src/index.ts` shows the intended runtime pipeline: command dispatch → load config/theme/preset/i18n → parse stdin → collect git/transcript → assemble `RenderContext` → render.
- `src/stdin.ts` is the example for compatibility helpers; add new stdin field fallbacks there instead of scattering checks in renderers.
- `src/render.ts` is the example for adding a new preset element: implement a renderer and register it in `ELEMENT_RENDERERS`.
- `src/config.ts` is the example for config merge rules and user override discovery.
