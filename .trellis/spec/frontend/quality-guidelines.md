# Quality Guidelines

> Code quality standards for terminal presentation/frontend-equivalent work.

---

## Overview

Frontend-equivalent work in this repo means terminal/statusline presentation: renderer functions, theme TOML, preset JSON, and i18n labels. There is no browser UI test suite or accessibility test runner.

---

## Required Patterns

- Keep renderers pure: return strings or `null`; do not write to stdout/stderr from renderer modules.
- Preserve separator behavior in `src/render.ts`: only non-null element strings are joined, and empty lines are skipped.
- Respect config visibility flags: `src/render.ts` skips elements with `rc.config.elements?.[elem] === false`.
- Keep theme and preset responsibilities separate:
  - `themes/*.toml` controls colors/icons.
  - `presets/*.json` controls element order and line grouping.
- Maintain label fallback behavior when using i18n values, e.g. `i18n.context || 'Ctx'` and `i18n.usage || 'Use'`.

---

## Forbidden Patterns

- Do not add web frontend dependencies or TSX/JSX for statusline rendering.
- Do not hard-code a theme-specific visual change in a preset, or a layout change in a theme.
- Do not add noisy output during normal rendering.
- Do not remove the ability for optional elements to hide themselves by returning `null`.

---

## Testing Requirements

- For renderer/theme/preset/i18n changes, run `npm run build` and `git diff --check`.
- For visible rendering changes, run a targeted smoke test using sample stdin piped to `node dist/index.js` after build.
- For docs/spec-only changes, `git diff --check` is sufficient.

---

## Code Review Checklist

- Does the output remain compact and suitable for a Claude Code statusline?
- Are colors/icons read from `Theme` rather than hard-coded unnecessarily?
- Does the element work correctly when data is missing or config hides it?
- If a preset references a new element, is it registered in `ELEMENT_RENDERERS`?
- If a theme adds keys, are `ThemeColors`/`ThemeIcons` and loading logic consistent?
