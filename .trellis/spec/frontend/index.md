# Frontend Development Guidelines

> Guidelines for the terminal presentation layer in this project.

---

## Overview

CC-Fusion has no browser frontend. In Trellis terms, the `frontend` layer maps to terminal/statusline presentation: render functions, theme TOML, preset JSON, and i18n labels.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Presentation module and asset layout | Filled |
| [Component Guidelines](./component-guidelines.md) | Renderer-function patterns instead of framework components | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Explicit absence of React hooks; helper-function alternatives | Filled |
| [State Management](./state-management.md) | Per-invocation render state and config derivation | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Renderer/theme/preset verification standards | Filled |
| [Type Safety](./type-safety.md) | Strict TypeScript and untrusted JSON narrowing | Filled |

---

## Pre-Development Checklist

Before changing presentation behavior:

1. Identify whether the change belongs in a renderer module, `src/render.ts`, `themes/`, `presets/`, or `i18n/`.
2. Confirm theme changes do not alter layout and preset changes do not encode palette/icon behavior.
3. Check existing examples in `src/context.ts`, `src/usage.ts`, `src/cost.ts`, `src/render.ts`, `themes/cometix.toml`, and `presets/full.json`.

---

## Quality Check

- Docs/spec-only: run `git diff --check`.
- Presentation code/assets: run `npm run build`, `git diff --check`, and a targeted statusline smoke test when output changes.

---

**Language**: All documentation should be written in **English**.
