# Backend Development Guidelines

> Guidelines for the Node/TypeScript CLI runtime in this project.

---

## Overview

CC-Fusion has no server backend. In Trellis terms, the `backend` layer maps to the CLI runtime and file/process integrations under `src/`.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | CLI module organization and file layout | Filled |
| [Database Guidelines](./database-guidelines.md) | Explicit absence of database/ORM and real file-based data sources | Filled |
| [Error Handling](./error-handling.md) | Fallbacks, CLI errors, and resilient statusline behavior | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Build/smoke verification and code standards | Filled |
| [Logging Guidelines](./logging-guidelines.md) | stdout/stderr rules for a statusline CLI | Filled |

---

## Pre-Development Checklist

Before changing CLI/runtime behavior:

1. Read the specific guideline file for the touched area.
2. Check existing examples in `src/index.ts`, `src/stdin.ts`, `src/config.ts`, `src/render.ts`, and the relevant renderer module.
3. Preserve statusline stdout cleanliness and command-before-stdin dispatch.

---

## Quality Check

- Docs/spec-only: run `git diff --check`.
- Runtime TypeScript: run `npm run build` and `git diff --check`.
- Rendering behavior: after build, run a targeted stdin smoke test with `node dist/index.js`.

---

**Language**: All documentation should be written in **English**.
