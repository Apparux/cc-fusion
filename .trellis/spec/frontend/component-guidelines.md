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

## Scenario: Effort Level in the Fixed First Line

### 1. Scope / Trigger

Apply this contract when Claude Code stdin includes an effort level and the fixed first statusline row is rendered.

### 2. Signatures

```typescript
getEffortLevel(stdin: StdinData, env?: NodeJS.ProcessEnv): string | undefined
renderLine1(ctx: RenderContext): string
```

### 3. Contracts

- Read the current `effort.level` statusline field first, then fall back to legacy `effortLevel` and `effort_level` fields.
- When stdin has no valid level, use the current-turn `CLAUDE_EFFORT` environment value before the session override `CLAUDE_CODE_EFFORT_LEVEL`.
- Treat environment values `auto` and `unset` as absent.
- Trim the selected string and normalize it to lowercase in `src/stdin.ts`; renderers must not inspect raw effort fields or environment variables.
- Append `🧿 <level>` after Git, or after Project when Git is unavailable, through `joinWithAlignedFirstSeparator`.
- Render `low` yellow, `medium` blue, `high` bright blue, and unknown non-empty levels gray.
- Render `xhigh` as static light-purple `🧿 xhigh`, always ending with an ANSI reset.
- Render `max` as static `🧿 max`: green `m`, bright-blue `a`, and light-purple `x`, with exactly one plain-text `max` and a final ANSI reset.
- Do not derive presentation from time or refresh count, and do not emit ANSI blink (`SGR 5`) or start a background process.
- Normalize both `ultra` and `ultracode` to the static deep-purple label `🧿 ultracode`.

### 4. Validation & Error Matrix

| Input condition | Expected behavior |
| --- | --- |
| `effort.level` contains a non-empty string | Normalize and use it before all legacy fields and environment fallbacks. |
| camelCase contains a non-empty string | Normalize and use it before snake_case or environment fallbacks. |
| camelCase is invalid and snake_case contains a non-empty string | Normalize and use snake_case. |
| stdin fields are invalid and `CLAUDE_EFFORT` is valid | Use the current-turn environment value. |
| `CLAUDE_EFFORT` is absent and `CLAUDE_CODE_EFFORT_LEVEL` is valid | Use the configured session override. |
| All stdin and environment sources are missing, empty, or invalid | Hide effort without a dangling separator. |
| A future non-empty string level is received | Preserve the normalized label and render it gray. |
| Git data is unavailable | Place effort directly after Project. |
| The same level is rendered at different times | Return identical ANSI output; styling must not depend on time or refresh count. |
| `max` is rendered | Emit the readable plain-text label `🧿 max` exactly once, with green/bright-blue/light-purple letters. |

### 5. Good / Base / Bad Cases

- Good: `effort: { level: " XHIGH " }` renders static light-purple `🧿 xhigh` after Git.
- Base: no stdin effort plus `CLAUDE_EFFORT=max` renders a static `🧿 max` with green `m`, bright-blue `a`, and light-purple `x`.
- Bad input: malformed stdin effort with no valid environment fallback does not throw and does not render effort.

### 6. Tests Required

- Exercise the packaged CLI entrypoint with every known visual mode and assert the relevant ANSI codes, readable labels, final reset, and absence of `SGR 5`.
- Render `xhigh` and `max` at different mocked times and assert byte-identical output; verify `max` contains exactly one plain-text `max` with green/bright-blue/light-purple letters.
- Cover current `effort.level`, legacy camelCase/snake_case fields, environment fallback priority, trimming, lowercase normalization, unknown strings, and malformed values.
- Assert first-row ordering both inside and outside a Git repository and verify no trailing separator when effort is hidden.
- Render consecutive different levels to ensure no invocation-level state is cached.

### 7. Wrong vs Correct

```typescript
// Wrong: schema checks are scattered into presentation code.
const level = ctx.stdin.effortLevel as string;
parts.push(`🧿 ${level.toLowerCase()}`);

// Correct: normalize input once and keep presentation independent of refresh timing.
const level = getEffortLevel(ctx.stdin);
if (level) parts.push(renderEffortLevel(level));
```

## Common Mistakes

- Do not add TSX/JSX or a frontend framework to implement statusline elements.
- Do not put layout decisions in theme TOML files; use presets for layout.
- Do not print directly from renderer functions. Return strings and let `src/index.ts` write the final output.
