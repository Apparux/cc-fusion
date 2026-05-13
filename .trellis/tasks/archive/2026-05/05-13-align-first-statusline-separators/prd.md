# 对齐 statusline 每行第一个分隔符

## Goal

让 statusline 每行标题后的第一个 `|` 根据第 1 行第一个分隔符位置自适应对齐，改善多行标题区视觉一致性。只对齐每行第一个分隔符，后续分隔符保持各行原有布局，不改变 5 行架构和现有内容。

## What I already know

* 用户明确需求：标题后的第一个分隔符按行 1 的位置对齐。
* 用户明确范围：只需要第一个分隔符对齐，后面的分隔符可以不用对齐。
* 当前 `src/lines/line1.ts` 使用 `parts.join(colorize('  |  ', COLORS.gray))`，第一个分隔符由第一个 part（模型）长度决定。
* 当前 `src/lines/line3.ts`、`src/lines/line4.ts`、`src/lines/line5.ts` 也使用 `parts.join(colorize('  |  ', COLORS.gray))`。
* 当前 `src/lines/line2.ts` 手动插入了 `colorize('|', COLORS.gray)`，与其他行不一致。
* 需要保留 Context 当前视觉要求：`Context | ● xx.x%`、圆角扁进度条、token 文本。

## Assumptions

* 对齐基准是行 1 第一个内容段 `👾 ${ctx.model}` 的显示宽度。
* 每行标题段后补空格，使第一个 `|` 的可见列与行 1 一致。
* 为避免误改后续布局，只统一第一个分隔符；第一个分隔符之后的内容仍按各行原本间距拼接。
* ANSI 颜色码不应计入宽度；emoji/全宽字符按终端显示宽度近似计算。

## Open Questions

* None.

## Requirements

* 每行标题后的第一个 `|` 必须按行 1 第一个 `|` 的可见列对齐。
* 只对齐第一个 `|`；后续 `|` 不需要跨行对齐。
* 保留每行原有内容、顺序和颜色。
* 保留整体 5 行 statusline 架构。
* 保留 Context 行当前结构：`Context` → aligned gray `|` → `● xx.x%` → rounded-flat progress bar → cyan token usage。
* 保留 Context 进度条圆角端帽和 `═` 主体，不回退到其他 glyph。
* 不新增配置项，不改 README/docs，不做 npm release。
* 宽度计算不能被 ANSI color code 干扰。

## Acceptance Criteria

* [ ] line1、line2、line3、line4、line5 的第一个 `|` 在去除 ANSI 后位于同一字符串索引/显示列。
* [ ] 后续分隔符不要求对齐，且仍出现在原有内容之间。
* [ ] Context 行仍包含 gray `|`、`● xx.x%`、rounded-flat progress bar、token text。
* [ ] Context bar 仍包含 ``、`═`、``，且不包含 `▄`、`▬`、`█`、`━`、`─`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] 代表性 smoke case 覆盖至少 `41.0%` 的当前截图场景。
* [ ] Context 阈值 smoke tests 覆盖 `32.5`, `68.7`, `92.3`, `59.9`, `60`, `79.9`, `80`。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted statusline smoke verifies first separator alignment across all 5 lines.
* Targeted Context smoke verifies existing progress bar and metadata are preserved.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Add/reuse a small rendering helper, likely in `src/utils.ts`, to join line parts with an aligned first separator.
* Strip ANSI escape sequences before width/column calculation.
* Use line 1 first part (`👾 ${ctx.model}`) as the target width at render time.
* Update line renderers to use the helper for the first separator while preserving their per-line remaining joins.
* Keep `src/render.ts` 5-line composition unchanged unless a cleaner centralized approach is required.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: Each line currently decides its own separator placement, so shorter labels like `Context`/`Tasks` cause the first divider to drift left relative to the model line.

**Decision**: Normalize only the first separator column using line 1's first segment width as the alignment target, leaving later separators local to each row.

**Consequences**: The title column becomes visually aligned without forcing a full table layout or changing downstream row content spacing.

## Out of Scope

* Aligning later separators across rows.
* Changing icons, labels, colors, or content order.
* Redesigning presets/layouts.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/lines/line1.ts`, `src/lines/line2.ts`, `src/lines/line3.ts`, `src/lines/line4.ts`, `src/lines/line5.ts`, possibly `src/utils.ts`, generated `dist/**` after build.
* `src/render.ts` composes exactly 5 lines and should stay unchanged if possible.
* `.trellis/spec/backend/quality-guidelines.md` requires build, smoke tests, diff check, and pack preview for runtime rendering changes.
