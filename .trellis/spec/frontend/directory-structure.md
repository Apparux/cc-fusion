# Directory Structure

> How frontend code is organized in this project.

---

## Overview

This repository has no browser frontend, React/Vue/Svelte app, routes, pages, CSS modules, or client-side bundler. CC-Fusion is a Node TypeScript CLI that renders terminal/statusline UI strings.

For Trellis purposes, `frontend` guidelines describe the terminal presentation layer: renderer modules, themes, presets, and i18n labels.

---

## Presentation Layout

```text
src/render.ts      # element registry and preset line composition
src/context.ts     # context progress bar rendering
src/usage.ts       # usage/rate-limit progress bar rendering
src/cost.ts        # cost element rendering
src/effort.ts      # effort element rendering
src/utils.ts       # ANSI colors, bars, formatting, separators
src/types.ts       # Theme, Preset, RenderContext, Config interfaces

themes/*.toml      # visual palettes/icons
presets/*.json     # line layouts listing render element names
i18n/*.json        # display labels
```

---

## Module Organization

- Add or change terminal UI elements in `src/render.ts` and, when behavior is non-trivial, a focused renderer module like `src/context.ts` or `src/usage.ts`.
- Keep theme assets in `themes/*.toml`. Themes control colors/icons only.
- Keep layout assets in `presets/*.json`. Presets control line structure and element ordering only.
- Keep labels in `i18n/*.json`; renderer modules should accept the loaded `i18n` record and provide sensible English fallbacks where current code already does so.

---

## Naming Conventions

- Preset element names are lowercase strings such as `model`, `dir`, `git`, `context`, `usage`, `cost`, `duration`, `effort`, `tools`, `agents`, and `todos`.
- Renderer functions are named `render<Element>` or `render<Element>Element` depending on whether they are exported module renderers or internal `src/render.ts` adapters.
- Theme color/icon keys use camelCase matching `ThemeColors` and `ThemeIcons` in `src/types.ts`.

---

## Examples

- `presets/full.json` defines the multi-line layout using arrays of element names.
- `themes/cometix.toml` defines `[colors]` and `[icons]` sections consumed by `loadTheme` in `src/config.ts`.
- `src/context.ts` and `src/usage.ts` show progress bar rendering with traffic-light colors and optional neon bracket wrapping.
- `src/render.ts` shows how empty/null elements are skipped so layouts do not render blank sections.
