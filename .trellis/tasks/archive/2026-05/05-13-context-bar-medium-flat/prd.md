# 修正 Context 进度条为中等厚度扁条

## Goal

再次修正 Context 进度条视觉：用户说“改扁一点”指的是比上一版厚重 `█` 圆角 pill 更扁，而不是恢复成原来 `━/─` 这种细细一条。保持 Context 行其他元信息不变，只把 progress bar 调整为中等厚度的扁条。

## What I already know

* 用户明确纠正：不是恢复原来细细的一条。
* 用户仍要求保留 `●` 和 token 文本。
* 当前 `src/lines/line2.ts` 已恢复顺序：`Context` → `● xx.x%` → progress bar → token usage。
* 当前 `src/utils.ts` 使用 `━` / `─`，这被用户认为太细。
* 上一版 `████...` / `█` 主体又太厚。
* 目标是中间形态：比 `█` pill 扁，但比 `━/─` 线条更厚、更像条形进度条。
* 颜色阈值保持 `<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* 整体 5 行 statusline 架构不变。

## Assumptions

* 使用半高块字符（例如 `▄`）作为 bar 主体最接近“比 `█` 扁但不是细线”。
* 终端无法真正控制单字符高度；中等厚度只能通过 Unicode glyph 近似。
* 为了避免视觉再次过厚，本次不使用 `█` 作为主体。
* 为了避免退回细线，本次不使用 `━` / `─` 作为主体。

## Open Questions

* None.

## Requirements

* Context 行必须保留当前元信息结构：图标 + `Context` 标签、`● xx.x%`、progress bar、token usage。
* 不移除 `●`。
* 不移除 token 文本。
* 不改变 token 文本格式和 cyan 颜色：`${ctx.contextUsed} / ${ctx.contextTotal} tokens`。
* 只调整 progress bar 的视觉字符/厚度。
* Progress bar 必须比 `█` 主体 pill 更扁。
* Progress bar 不能退回 `━` / `─` 细线主体。
* Progress bar 应使用中等厚度字符，优先使用半高块 `▄` 作为主体。
* Progress bar 宽度保持约 14–18 字符，默认 16。
* Progress bar 的已用段使用低/中/高档位颜色，未用轨道使用 dim/dark 颜色。
* 低/中/高三档仍为 `<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* 保留 decimal percentage，一位小数。
* 不改其他 statusline 行，不新增配置项，不改 README/docs，不做 npm release。

## Acceptance Criteria

* [ ] Context 行包含 `● xx.x%`。
* [ ] Context 行包含 token 用量文本和 `tokens`。
* [ ] Context 行顺序为 `Context` → `● xx.x%` → progress bar → token usage。
* [ ] Progress bar 主体不是 `█`。
* [ ] Progress bar 主体不是 `━` / `─`。
* [ ] Progress bar 使用中等厚度扁条字符，例如 `▄`。
* [ ] Progress bar 宽度为 16 或在 14–18 字符范围内。
* [ ] 32.5% 为绿色档位，68.7% 为黄色档位，92.3% 为红色档位。
* [ ] 阈值边界 smoke tests 覆盖 `59.9`, `60`, `79.9`, `80`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted stdin smoke tests cover low/medium/high and threshold boundaries.
* Smoke assertions verify ordering, presence of `●`, presence of token text, and bar glyph is medium-flat (`▄`) rather than `█` or `━/─`.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Leave `src/lines/line2.ts` composition unchanged unless verification reveals drift.
* Update `src/utils.ts` `renderProgressBar` so both filled and empty segments use a medium-flat glyph, preferably `▄`.
* Keep color separation outside the helper: filled segment is colored by `progressColor`; empty segment remains `COLORS.dim` at call site.
* Keep `progressColor` and `calcContextPct` unchanged.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The previous correction interpreted “flatter” as returning to the old line-style `━/─` bar, but the user wanted a middle ground between thick block pill and thin line.

**Decision**: Use a half-height block style (`▄`) for the progress bar body. This keeps the bar visually substantial while making it flatter than full-height `█`.

**Consequences**: The bar depends on terminal glyph rendering, but it better matches the requested visual hierarchy: noticeable progress track without dominating the Context row.

## Out of Scope

* Removing or reordering Context metadata.
* Changing `●`, percentage formatting, or token text.
* Changes to other statusline lines.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/utils.ts`, likely generated `dist/utils.js` after build.
* `src/lines/line2.ts` should stay compositionally unchanged from the metadata-preserving fix.
* `.trellis/spec/backend/quality-guidelines.md` requires Context threshold smoke tests.
