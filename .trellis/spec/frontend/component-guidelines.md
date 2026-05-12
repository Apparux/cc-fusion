# Component Guidelines

> How UI components are built in this project.

---

## Overview

There are no framework components in this repository. Do not create React/Vue/Svelte components, JSX/TSX files, browser DOM code, or CSS component systems for ordinary cc-fusion work.

The UI is terminal text assembled from pure TypeScript renderer functions.

---

## Component Structure Equivalent

Use renderer functions instead of components:

- `src/render.ts` owns high-level element composition through `ELEMENT_RENDERERS`.
- Focused element modules export pure render functions, for example `renderContext` in `src/context.ts`, `renderUsage` in `src/usage.ts`, and `renderCost` in `src/cost.ts`.
- Renderers receive typed data (`RenderContext`, `Theme`, `StdinData`, options, i18n labels) and return a `string` or `null` when the element should be hidden.

---

## Props Conventions Equivalent

- Use TypeScript interfaces for renderer options when a module needs them. Examples: `ContextRenderOptions` in `src/context.ts` and `UsageRenderOptions` in `src/usage.ts`.
- Use shared interfaces from `src/types.ts` for cross-module data such as `RenderContext`, `Theme`, `Config`, and `StdinData`.
- Prefer passing only the data needed by focused renderer modules rather than the entire `RenderContext`, unless the function is an internal adapter in `src/render.ts`.

---

## Styling Patterns

- Terminal styling is ANSI-based through helpers in `src/utils.ts`: `colorize`, `bold`, `dim`, `progressBar`, `trafficColor`, and `sep`.
- Theme colors/icons come from `Theme` values loaded by `src/config.ts`; do not hard-code theme-specific colors inside renderer modules except existing generic ANSI token breakdown labels in `src/context.ts`.
- Preserve the established behavior where neon themes wrap progress bars in dim brackets, as shown in `src/context.ts` and `src/usage.ts`.

---

## Accessibility

There is no browser accessibility layer. For terminal UI, keep output readable without relying solely on icons:

- Include text labels such as `Ctx`, `Use`, translated `i18n` labels, or numeric values.
- Ensure elements can be hidden by returning `null` without leaving dangling separators.
- Keep output compact enough for a statusline.

---

## Common Mistakes

- Do not add TSX/JSX or a frontend framework to implement statusline elements.
- Do not put layout decisions in theme TOML files; use presets for layout.
- Do not print directly from renderer functions. Return strings and let `src/index.ts` write the final output.
