# 排查状态栏任务与上下文显示异常

## Goal

排查并修复 cc-fusion 状态栏中 Tasks 与 Context 两类显示异常，避免用户在 Claude Code 执行过程中看到误导性的“无待办任务”或临时 `0.0% / 0` context。

## Confirmed Facts

- 用户截图中 Claude Code 原生任务区显示 1 个已完成任务和 1 个进行中任务，但 cc-fusion `💤 Tasks` 行显示“无待办任务”。
- 用户截图中 `🧠 Context` 行在 thinking 或某些动作阶段临时显示 `0.0%`、`0 / 1.0M tokens`，随后继续执行时又恢复正常。
- `src/index.ts` 通过 `calcContextPct`、`getContextTokens`、`getContextWindowSize` 构造 Context 行，通过 `findTranscript` 和 `parseTranscript` 构造工具/任务数据。
- `src/stdin.ts` 当前在缺少 `context_window.used_percentage` 且 token/window 字段不足时会回退为 `0`；`src/index.ts` 在缺少 window size 时会用 `200000` 作为展示兜底。
- `src/transcript.ts` 当前 Tasks 解析主要识别 transcript 中的 `TaskCreate` / `TaskUpdate`，并从 `tool_result` 文本回填创建后的任务 ID。
- 本机近期 Claude transcript 显示当前 `TaskCreate` 常见输入结构是 `subject` / `description` / `activeForm`，没有 `taskId`；真实 ID 主要在 `tool_result` 文本 `Task #N created successfully: ...` 中。
- 长 transcript 对比显示现有 tail-read 策略会只读到近期 `TaskUpdate`，但读不到早期 `TaskCreate` / 创建结果，导致更新无法匹配既有任务并丢失 Tasks 展示。
- `src/lines/line4.ts` 在 `ctx.tools.todos.length === 0` 时显示“无待办任务”。
- 现有回归测试覆盖旧式 context 字段、当前 `context_window` 字段，以及 `TaskCreate` / `TaskUpdate` 批次解析；尚未覆盖 context 字段阶段性缺失、当前 `TaskCreate` 先无 ID 后通过 result 回填、或长 transcript tail 截断场景。

## Requirements

- 判定 Tasks 不精准的根因：是 transcript 定位失败、当前 Claude Code 待办工具格式未兼容、tail-read 截断、还是渲染策略误导。
- 必须处理超长 transcript 中 `TaskCreate` / 创建结果已在 tail 窗口外、尾部只剩 `TaskUpdate` 的场景；Tasks 解析不能因此丢失当前待办状态。
- 判定 Context 临时归零的根因：是 Claude Code 在 thinking/部分动作期间传入字段不完整、字段路径变化、解析兼容缺口，还是渲染兜底策略误导。
- 若是 cc-fusion 兼容或渲染问题，应修复为更稳定、可解释的显示：
  - 有可解析待办时应展示当前 Claude Code 待办状态。
  - 没有可解析待办数据时继续显示“无待办任务”，避免增加新的不确定状态文案。
  - 暂时缺少 context 用量字段时不应伪装成真实 `0.0% / 0`。
- 新增回归测试覆盖复现样例和修复后的行为。
- 保持 context 输入兼容逻辑集中在 `src/stdin.ts`，transcript/待办解析集中在 `src/transcript.ts`。

## Acceptance Criteria

- [ ] 给出两个现象的根因判断：BUG、上游输入阶段性缺字段，或两者兼有。
- [ ] Tasks 行能兼容当前 Claude Code transcript 中的待办数据格式，截图同类场景不再显示“无待办任务”。
- [ ] 对超长 transcript，即使 `TaskCreate` / 创建结果位于默认 tail 窗口外、尾部只剩 `TaskUpdate`，仍能恢复任务列表和当前状态。
- [ ] Context 行在 stdin 缺少可用 context usage 时不再显示误导性的 `0.0% / 0`；若仍知道窗口大小，应显示 `--.-%  -- / 1.0M tokens` 这类未知已用量 + 已知总量的占位，不缓存上次值。
- [ ] 新增或更新回归测试覆盖 Tasks 当前格式、Context 字段缺失/临时不可用场景。
- [ ] `npm test` 通过。
- [ ] 针对截图同类 stdin/transcript 样例完成 CLI smoke test。

## Out of Scope

- 不修改 Claude Code 自身的原生任务区或上游 stdin 行为。
- 不重新设计状态栏整体布局、主题或预设。
- 不在本任务中处理 npm 发布，除非用户后续明确要求。

## Decisions

- Tasks 行在没有可解析任务数据时继续显示“无待办任务”，本任务优先修复可解析数据被漏掉的问题，而不是新增未知状态文案。
- Context 行在 Claude Code 暂时没有提供可用 context usage 时显示未知占位，不缓存上次值，也不继续显示 `0.0% / 0`；如果仍知道窗口大小，则显示 `--.-%  -- / 1.0M tokens`。

## Open Questions

- None.
