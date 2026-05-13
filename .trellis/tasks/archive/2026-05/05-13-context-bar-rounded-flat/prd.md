# 恢复 Context 圆角扁进度条

## Goal

修正 Context 进度条视觉：保留用户最初要求的圆角 pill 方向，只把厚度轻微压扁，不能换成非圆角块状条或细线条。当前 `▬` 既不圆角又仍有轻微下沉，需要改为圆角端帽 + 居中横向主体的终端近似方案。

## What I already know

* 用户最初明确要求圆角进度条。
* 之前 `████...` 已满足圆角方向，但用户只要求“扁一点点”。
* 后续改成 `▄` 导致进度条向下偏移。
* 后续改成 `▬` 仍略向下且丢失圆角。
* 当前 `src/lines/line2.ts` 已保留 `Context | ● xx.x% progress tokens` 结构，这部分不要再改坏。
* 当前 `src/utils.ts` `renderProgressBar` 使用 `▬` 作为主体，需要替换。
* 终端无法做 CSS 圆角/高度；只能用 Nerd Font / Powerline 端帽和 Unicode 横线近似。

## Assumptions

* 使用 Powerline/Nerd Font 圆角端帽 `` / `` 恢复圆角。
* 使用居中双线主体 `═` 作为“比 `█` 扁一点点、但不是细细一条”的主体。
* `═` 比 `█` 更扁且居中，不会像 `▄` 一样下沉，也比 `━/─` 更有厚度。
* `renderProgressBar` 的 `width` 表示可见总宽度，包含左右端帽，默认保持 16。

## Open Questions

* None.

## Requirements

* Progress bar 必须保留圆角端帽，使用 `` 和 `` 或等价 Powerline/Nerd Font 圆角字符。
* Progress bar 必须比 `████...` 轻微更扁。
* Progress bar 不能使用 `▄`，避免向下偏移。
* Progress bar 不能使用当前非圆角 `▬` 主体。
* Progress bar 不能退回 `━` / `─` 细线主体。
* Progress bar 主体应使用居中、比单线更厚的 `═`。
* Progress bar 必须保留彩色已用段 + dim/dark 未用轨道。
* Progress bar 总可见宽度保持约 16，允许 14–18 范围。
* Context 行必须保留当前结构：`Context` → gray `|` → `● xx.x%` → progress bar → cyan token usage。
* 不移除 `●`，不移除 token 文本，不改 token 文本颜色。
* 颜色阈值保持 `<60` 绿色、`>=60 && <80` 黄色、`>=80` 红色。
* 整体 statusline 仍输出 5 行。
* 不改 README/docs，不新增配置，不做 npm release。

## Acceptance Criteria

* [ ] Context 行包含 `Context` 后的 gray `|`。
* [ ] Context 行包含 `● xx.x%`。
* [ ] Context 行包含 cyan token 用量文本和 `tokens`。
* [ ] Progress bar 包含圆角端帽 `` 和 ``。
* [ ] Progress bar 主体包含 `═`。
* [ ] Progress bar 不包含 `▄`、`▬`、`█`、`━`、`─`。
* [ ] Progress bar 总可见宽度为 16 或在 14–18 字符范围内。
* [ ] 32.5% 为绿色档位，68.7% 为黄色档位，92.3% 为红色档位。
* [ ] 阈值边界 smoke tests 覆盖 `59.9`, `60`, `79.9`, `80`。
* [ ] 整体 statusline 仍输出 5 行。
* [ ] `npm run build` 通过。
* [ ] `git diff --check` 通过。
* [ ] `npm pack --dry-run` 通过。

## Definition of Done

* Build/typecheck green via `npm run build`.
* Targeted Context smoke tests cover low/medium/high and threshold boundaries.
* Smoke assertions verify separator, `●`, token text, rounded caps, centered body glyph, forbidden glyph absence, and 5-line output.
* `git diff --check` passes.
* `npm pack --dry-run` passes.
* Work is committed and pushed per project workflow.

## Technical Approach

* Leave `src/lines/line2.ts` structure unchanged unless verification reveals drift.
* Update `src/utils.ts` `renderProgressBar` to render visible-width rounded bar:
  * 0%: dim `` + dim `═...` + dim ``
  * partial: colored `` + colored filled `═...` + dim empty `═...` + dim ``
  * 100%: colored `` + colored `═...` + colored ``
* Preserve existing `{ filled, empty }` return shape so `line2.ts` can keep coloring filled and empty separately.
* Run `npm run build` to regenerate `dist/`; do not hand-edit generated files.

## Decision (ADR-lite)

**Context**: The accepted direction was rounded pill, then the user requested a slight flattening. Replacing the bar with `▄` or `▬` changed the visual language instead of preserving it.

**Decision**: Restore Powerline/Nerd Font rounded caps and use centered double-line `═` as the flatter body.

**Consequences**: The bar remains recognizably rounded while appearing lighter than full-block `█`; rendering still depends on terminal font support for Powerline/Nerd Font caps.

## Out of Scope

* Changing Context metadata/order beyond preserving current structure.
* Changing Tasks, Agents, Activity, or other statusline rows.
* New config/theme/preset options.
* README/docs updates.
* npm release/tagging.

## Technical Notes

* Relevant files: `src/utils.ts`, generated `dist/utils.js` after build.
* `src/lines/line2.ts` should remain compositionally unchanged unless verification shows drift.
* `.trellis/spec/backend/quality-guidelines.md` requires Context threshold smoke tests.
