# 修正 Context 进度条但保留元信息

## Goal

修正上一轮 Context 行改动：用户只希望调整 Context 进度条样式，不希望移除 `●` 百分比指示或 token 用量文本。本任务恢复 Context 行除进度条以外的原有信息结构，并把当前过厚的圆角 pill 调整得更扁一些。

## What I already know

* 用户明确纠正：不要去掉 `●` 和 token 文本。
* 用户明确范围：只改进度条，其他 Context 元素都要保留。
* 用户补充视觉要求：进度条要比当前圆角 pill 再扁一点。
* 当前 `src/lines/line2.ts` 输出为 `Context` → rounded pill → percentage，缺少 `●` 和 token 文本。
* 当前 `src/utils.ts` 使用 `` / `` 加 `█`，视觉较厚。
* 颜色阈值仍应保持 `<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* `calcContextPct` 已保留 decimal percentage，适合继续显示一位小数。

## Assumptions

* 恢复上一轮之前的 Context 信息结构：`🧠 Context` → `● xx.x%` → progress bar → token usage。
* 只调整 progress bar 的字符/宽度/视觉厚度，不改其他 statusline 行。
* “更扁一点”指不要再用厚重的 `█` 块作为主体，可改为较扁的横线/半高线条并保留彩色已用段和暗色轨道。

## Open Questions

* None.

## Requirements

* Context 行必须保留 `●`。
* Context 行必须保留一位小数百分比，且与 `●` 组合展示。
* Context 行必须保留 token 用量文本。
* Context 行除 progress bar 外的元素和顺序恢复为：图标 + `Context` 标签、`● xx.x%`、progress bar、token usage。
* Progress bar 继续表达低/中/高三档颜色：`<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* Progress bar 的已用段使用档位颜色，未用轨道使用暗色/dim 颜色。
* Progress bar 要比当前 `████...` pill 更扁，避免厚重块状主体。
* 继续保持比最早 10 格更长，目标宽度约 14–18 字符。
* 不改整体 5 行 statusline 架构。
* 不新增配置项，不改 README/docs，不做 npm release。

## Acceptance Criteria

* [ ] Context 行包含 `●`。
* [ ] Context 行包含 token 用量文本，例如 `tokens`。
* [ ] Context 行输出顺序为 `Context` → `● xx.x%` → progress bar → token usage。
* [ ] Progress bar 比当前厚块 `█` pill 更扁，不使用 `█` 作为主体。
* [ ] 32.5% 为绿色档位，68.7% 为黄色档位，92.3% 为红色档位。
* [ ] 阈值边界 smoke tests 覆盖 `59.9`, `60`, `79.9`, `80`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted stdin smoke tests cover low/medium/high and threshold boundaries.
* Smoke assertions verify ordering, presence of `●`, presence of token text, and absence of thick block主体 `█` in the progress bar.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Update `src/lines/line2.ts` to restore the Context row composition around the progress bar: label, `● xx.x%`, progress bar, token text.
* Update `src/utils.ts` progress helper to render a flatter bar, likely using rounded/Powerline-style or line-style caps with `━` / `─`-like body instead of `█` blocks.
* Keep `progressColor` thresholds and `calcContextPct` decimal behavior unchanged.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The previous task over-scoped the screenshot interpretation and removed useful Context metadata that the user wanted to keep.

**Decision**: Treat the correction as a narrow progress-bar-only visual change: restore the original Context metadata (`●` percentage and token usage), while making only the bar flatter and color-coded.

**Consequences**: The row remains information-dense and closer to the user's intended scope, while the progress bar still improves visually without dominating the line.

## Out of Scope

* Removing or reordering non-progress Context metadata beyond restoring the prior structure.
* Changes to other statusline lines.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/lines/line2.ts`, `src/utils.ts`, generated `dist/**` after build.
* `src/render.ts` composes exactly 5 lines and should stay unchanged.
* `.trellis/spec/backend/quality-guidelines.md` requires Context threshold smoke tests.
