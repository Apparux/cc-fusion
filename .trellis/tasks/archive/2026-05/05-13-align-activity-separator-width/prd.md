# 修正 Activity 首个分隔符对齐

## Goal

修正 statusline 首个分隔符对齐中 line3 `Activity` 未对齐的问题。上一版只按 line1 当前模型段宽度作为目标，并且宽度估算没有按用户终端实际把 `⚡` 当作宽 emoji 处理；当 `⚡ Activity` 比 `👾 gpt-5.5` 更宽时，Activity 的第一个 `|` 会向右偏。目标是让 5 行第一个 `|` 在终端视觉列上真正对齐，后续分隔符仍不强制对齐。

## What I already know

* 用户指出：行 3 `Activity` 的首个分隔符没有对齐。
* 当前 `src/utils.ts` 的 `firstSeparatorTargetWidth(model)` 只返回 `displayWidth(\`👾 ${model}\`)`。
* 当前 `displayWidth` 没有把 `⚡` 这类 statusline icon 按用户终端中的 2 列宽度计算。
* 当模型为 `gpt-5.5` 时，`👾 gpt-5.5` 视觉宽度约为 10，而 `⚡ Activity` 在用户终端约为 11，Activity 不能通过“少补空格”左移，只能把所有行的目标列扩到最长标题宽度。
* 当前 Context 行结构和圆角扁进度条应保持不变：`Context | ● xx.x% ══... tokens`。

## Assumptions

* “第一个分隔符对齐”的真实目标高于“保持 line1 原始分隔符位置不变”；当 Activity 标题更宽时，line1 也应向右补空格以对齐最长标题。
* 对齐目标应为当前 5 行标题段的最大显示宽度：`👾 ${model}`、`🧠 Context`、`⚡ Activity`、`💤 Tasks`、`🌀 Agents`。
* `⚡` 在用户终端中应按 2 列显示。
* 后续分隔符不需要跨行对齐。

## Open Questions

* None.

## Requirements

* 5 行 statusline 的第一个 `|` 必须在终端视觉列上对齐。
* 对齐目标必须考虑所有 5 行标题段的最大显示宽度，而不是只使用 line1 当前宽度。
* `⚡` 必须按 2 列宽度计入显示宽度，避免 Activity 行少补空格或被误判已对齐。
* 只对齐第一个 `|`；后续 `|` 不强制对齐。
* 保留每行现有内容、顺序和颜色。
* 保留 Context 当前结构：`Context` → aligned gray `|` → `● xx.x%` → rounded-flat progress bar → cyan token usage。
* 保留 Context bar 的圆角端帽和 `═` 主体；不回退到 `▄`、`▬`、`█`、`━`、`─`。
* 保留整体 5 行 statusline 架构。
* 不新增配置项，不改 README/docs，不做 npm release。

## Acceptance Criteria

* [ ] 模型为 `gpt-5.5` 时，去 ANSI 后 line1 和 line3 的第一个 `|` 在终端显示列上相同。
* [ ] 模型为 `gpt-5.5` 时，5 行第一个 `|` 的终端显示列全部相同。
* [ ] `displayWidth('⚡ Activity')` 大于 `displayWidth('👾 gpt-5.5')`，且对齐目标采用较大的 Activity 宽度。
* [ ] line1 在 `gpt-5.5` 场景下会补足到最长标题宽度，而不是让 Activity 继续偏右。
* [ ] 后续分隔符不要求对齐，且仍按各行原有内容出现。
* [ ] Context 行仍包含 `Context`、gray `|`、`● xx.x%`、``、`═`、``、token text。
* [ ] Context bar 不包含 `▄`、`▬`、`█`、`━`、`─`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] Context 阈值 smoke tests 覆盖 `32.5`, `68.7`, `92.3`, `59.9`, `60`, `79.9`, `80`。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted statusline smoke verifies first separator alignment across all 5 lines using an independent display-width check that treats `⚡` as 2 columns.
* Targeted Context smoke verifies existing progress bar and metadata are preserved.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Update `src/utils.ts` display-width handling so `⚡` is counted as wide in this statusline context.
* Update `firstSeparatorTargetWidth(model)` to return the max display width across the five row labels, not just `👾 ${model}`.
* Keep `joinWithAlignedFirstSeparator` behavior: pad only the first part and use normal separators for remaining parts.
* Keep line renderers and `src/render.ts` architecture unchanged unless verification reveals drift.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The previous implementation passed its own alignment check but failed visually because the check used the same incomplete width model and treated the line1 model segment as the only target.

**Decision**: Align to the maximum first-label display width across all rows and count `⚡` as wide for the statusline icon set.

**Consequences**: In short-model cases, line1 may shift one column right so Activity can align; this matches the user's visible statusline instead of preserving a too-narrow line1 anchor.

## Out of Scope

* Aligning later separators across rows.
* Changing icons, labels, colors, or content order.
* Changing Context bar style beyond preserving it.
* Redesigning presets/layouts.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/utils.ts`, generated `dist/utils.js` after build.
* Existing line renderers already call `joinWithAlignedFirstSeparator`; they should not need structural changes.
* `.trellis/spec/backend/quality-guidelines.md` requires build, smoke tests, diff check, and pack preview for runtime rendering changes.
