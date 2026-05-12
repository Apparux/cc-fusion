# Type Safety

> Type safety patterns in this project.

---

## Overview

The project uses strict TypeScript for a Node CLI. `tsconfig.json` enables `strict`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, declarations, declaration maps, and source maps.

---

## Type Organization

- Shared cross-module interfaces live in `src/types.ts`: `StdinData`, `ContextWindow`, `UsageMetric`, `ToolStats`, `GitInfo`, `Theme`, `Preset`, `Config`, and `RenderContext`.
- Module-local option types live next to the renderer using them. Examples: `ContextRenderOptions` in `src/context.ts` and `UsageRenderOptions` in `src/usage.ts`.
- Use `import type` for type-only imports, as shown throughout `src/stdin.ts`, `src/config.ts`, `src/render.ts`, and renderer modules.

---

## Validation

There is no runtime validation library such as Zod/Yup/io-ts. Runtime validation is manual and defensive:

- `src/stdin.ts` checks `typeof`, `Number.isFinite`, arrays, and object/null before consuming flexible stdin/rate-limit fields.
- `src/config.ts` validates config override fields before merging known numeric, boolean map, and string-array settings.
- `src/transcript.ts` parses each JSONL line inside a try/catch and narrows entries before reading nested fields.

---

## Common Patterns

- Prefer optional properties on input interfaces because Claude Code stdin and transcript shapes vary over time.
- Use `Record<string, unknown>` for untrusted object maps and narrow before use.
- Use type assertions sparingly at integration boundaries after checks, such as config object merging or transcript tool item conversion.
- Keep public render/data types stable when adding new theme icons, config fields, or stdin compatibility fields.

---

## Forbidden Patterns

- Do not introduce broad `any`; use `unknown` plus narrowing when handling untrusted JSON.
- Do not assume optional stdin fields exist. Use helpers in `src/stdin.ts` and defaults.
- Do not duplicate shared interfaces inside feature modules when the shape is used across modules; extend `src/types.ts` instead.
- Do not disable TypeScript strictness to make a change compile.
