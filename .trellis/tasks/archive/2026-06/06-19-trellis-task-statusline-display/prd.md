# 兼容显示 Trellis 任务到状态栏

## Goal

让 cc-fusion 的 `💤 Tasks` 行在当前 Claude Code transcript 没有 `TaskCreate` / `TaskUpdate` Todo 数据时，能够 fallback 显示当前 Trellis active task，避免使用 Trellis 工作流时状态栏长期显示“无待办任务”。

## User Value

- 用户使用 Trellis 管需求时，状态栏仍能看到当前任务上下文。
- 保留既有 Claude Code Todo 展示能力，不破坏 `TaskCreate` / `TaskUpdate` 的任务列表和完成百分比。
- 在没有 Trellis active task 时继续显示“无待办任务”，避免误导。

## Confirmed Facts

- cc-fusion 当前 Tasks 行数据来自 `src/transcript.ts` 解析 Claude transcript。
- 当前 transcript 任务解析只识别 `TaskCreate` / `TaskUpdate`，并聚合成 `ToolStats.todos`、`totalTodos`、`doneTodos`。
- `src/lines/line4.ts` 在 `ctx.tools.todos.length === 0` 时显示“无待办任务”。
- Trellis 任务存储在 `.trellis/tasks/<MM-DD-slug>/task.json`，归档任务位于 `.trellis/tasks/archive/YYYY-MM/...`。
- Trellis active task 指针为 session-scoped runtime 状态，相关逻辑在 `.trellis/scripts/common/active_task.py`；当前仓库存在 `.trellis/.runtime/sessions/<key>.json`。
- Trellis `.trellis/.runtime/sessions/<key>.json` 至少包含 `platform`、`last_seen_at`、`current_task`、`current_run`；当前任务指针示例为 `.trellis/tasks/06-19-trellis-task-statusline-display`。
- Trellis `task.json` 至少提供 `title`、`status`、`priority`、`assignee`、`createdAt` 等字段。
- Trellis active task 通常是单个任务，不天然等同于多项 Todo，也没有可靠内建百分比。
- statusline 高频运行，不应每次 shell out 到 `python3 ./.trellis/scripts/task.py current`；应优先直接读本地文件并失败降级。

## Requirements

- 保持现有 Claude Code `TaskCreate` / `TaskUpdate` Todo 展示优先级：只要 transcript 中有 Todo，就不被 Trellis fallback 覆盖。
- 当 transcript 没有 Todo 且当前项目存在 Trellis active task 时，Tasks 行应显示该 Trellis task 的标题和状态。
- Trellis fallback 展示格式采用用户确认的“带 Trellis 标识 + 状态”：
  - 示例：`💤 Tasks  |  ⚡ Trellis 兼容显示 Trellis 任务到状态栏  |  in_progress`
- Trellis fallback 必须只读取本地 `.trellis` 文件，不能依赖调用 Python CLI、不能增加 stdout/stderr 调试输出。
- Trellis fallback 的文件读取和 JSON 解析必须容错：缺文件、坏 JSON、stale active pointer、无 active task 时都应回退为空任务数据。
- Trellis active task 状态至少映射：
  - `planning` → pending/future 类视觉状态
  - `in_progress` → current 类视觉状态
  - `completed` → done 类视觉状态
- 没有 Claude Code Todo 且没有可解析 Trellis active task 时，继续显示“无待办任务”。
- 不解析 `implement.md` checklist 作为完成百分比，除非后续明确扩展；本任务只显示当前 Trellis active task。

## Acceptance Criteria

- [ ] 有 Claude Code Todo 时，Tasks 行仍按现有逻辑显示 Todo 列表和百分比，不显示 Trellis fallback。
- [ ] 无 Claude Code Todo 且有 Trellis active task 时，Tasks 行显示 `Trellis <title>` 和原始 Trellis `status`，不再显示“无待办任务”。
- [ ] Trellis fallback 状态图标按 `planning`/`in_progress`/`completed` 映射到待办/当前/完成类视觉状态。
- [ ] 无 Claude Code Todo 且无 Trellis active task / active pointer stale / task.json 不可读时，Tasks 行继续显示“无待办任务”。
- [ ] Trellis fallback 不执行 `task.py current` 或其他外部命令，不向 statusline stdout/stderr 输出诊断。
- [ ] 新增回归测试覆盖 Trellis active task fallback、Claude Code Todo 优先级、stale/bad Trellis 数据降级。
- [ ] `npm test` 和 `git diff --check` 通过。
- [ ] 目标 smoke test 能用临时 `.trellis` runtime + stdin `cwd` 验证 Tasks 行显示 Trellis task。

## Out of Scope

- 不修改 Trellis 自身任务系统或 hooks。
- 不把 Trellis task 自动同步成 Claude Code `TaskCreate` / `TaskUpdate`。
- 不解析 `implement.md` checklist 或 Trellis workflow phase 来计算百分比。
- 不改变 cc-fusion 的整体布局、主题、颜色系统或 Context 行逻辑。
- 不做 npm release，除非用户后续明确要求。

## Decisions

- Trellis fallback 采用用户确认的“带 Trellis 标识 + 状态”格式，而不是隐藏来源或伪造百分比。
- Claude Code transcript Todo 始终优先；Trellis 只作为空 Todo 时的 fallback。
- 本任务不从 `implement.md` checkbox 计算 Trellis 完成进度。

## Open Questions

- None.
