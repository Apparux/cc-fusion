# 🚀 CC-Fusion Statusline — 设计文档 v3

> **核心原则**: 吸取两个项目各自最好的设计决策，而不是简单合并功能列表。

---

## 🔍 两个项目各自最好的设计

### CCometixLine 做得好的（必须保留）

| 设计 | 为什么好 | 来源 |
|------|----------|------|
| **Rust 二进制** | 零依赖、零启动延迟、跨平台单文件分发 | `main.rs` |
| **TUI 交互配置** | `ccline --config` 实时预览改配置，不用手写 JSON | `src/ui/` |
| **models.toml 模型映射** | 用 `pattern` 子串匹配 + `context_modifiers` 组合，支持任何第三方模型 | `models.toml` |
| **无 stdin 时显示主菜单** | `if io::stdin().is_terminal()` 智能检测，直接执行 `ccline` 也能用 | `main.rs` |
| **主题文件系统** | TOML 主题文件 + `--theme` 覆盖 + 自定义主题目录 | `src/ui/themes/` |
| **Claude Code 补丁器** | 禁用 context 警告、启用 verbose，自动备份 + 版本适应 | `src/utils/` |
| **段落独立可配** | 每个 segment 独立控制：开关、图标、颜色、格式 | `src/config/` |
| **Nerd Font 图标** | 视觉一致性，一眼区分信息类型 | 全局 |
| **npm + 手动双通道安装** | npm 全局 or 下载二进制都行 | README |

### Claude HUD 做得好的（必须保留）

| 设计 | 为什么好 | 来源 |
|------|----------|------|
| **Transcript JSONL 解析** | 从 `.jsonl` 文件提取工具调用、Agent 状态、TODO 进度——这是独家功能 | `transcript.ts` |
| **Traffic-Light 变色** | context 和 usage 统一绿→黄→红策略，一眼判断 | `render/` |
| **Token 明细展开** | ≥85% 自动显示 input/output/cache 分解，知道钱花哪了 | `context-cache.ts` |
| **外部 Usage 回退** | stdin 没有 rate_limits 时，读本地 JSON 快照文件 | `external-usage.ts` |
| **Prompt Cache 倒计时** | 实时显示缓存还剩多久过期，避免无效重试 | `context-cache.ts` |
| **Element Order 系统** | `elementOrder` 数组控制显示顺序，省略的条目自动隐藏 | `config.ts` |
| **Merge Groups** | 相邻元素共享一行（如 context+usage 合并显示） | `render/` |
| **i18n 支持** | `language: "zh"` 切换中文标签 | `i18n/` |
| **Context 格式选项** | percent / tokens / remaining / both 四种格式 | `config.ts` |
| **Git 分支溢出处理** | truncate vs wrap 两种策略 | `config.ts` |
| **Usage 外部快照** | 支持代理程序写入 JSON 作为 sidecar 数据源 | `external-usage.ts` |
| **Speed Tracker** | 实时计算输出 tok/s | `speed-tracker.ts` |
| **Cost 智能隐藏** | Bedrock/Vertex 等路由提供商自动隐藏费用（因为显示 $0.00 无意义） | `cost.ts` |
| **Effort 等级检测** | 读取 effortLevel 显示推理强度 | `effort.ts` |
| **7 天配额阈值** | ≥80% 才显示周配额，避免信息过载 | `config.ts` |

---

## 📐 融合架构设计

### 技术选型

```
语言: Rust (继承 CCometixLine)
数据源: stdin JSON + transcript JSONL + Git CLI + 本地 JSON 快照
配置: TOML (CCometixLine) + JSON 兼容层 (Claude HUD 迁移)
主题: TOML 主题文件 (CCometixLine)
```

### 数据源优先级

```
┌─────────────────────────────────────────────────┐
│ Claude Code stdin JSON (实时数据)                │
│  ├→ model, provider, context tokens             │
│  ├→ usage rate_limits (5h/7d)                   │
│  ├→ cost.total_cost_usd                         │
│  ├→ effort level, output style                  │
│  └→ session info                                │
├─────────────────────────────────────────────────┤
│ Transcript JSONL (活动数据)                      │
│  ├→ 工具调用记录 (read/edit/grep/bash)          │
│  ├→ 子 Agent 状态 + 耗时                        │
│  ├→ TODO 进度                                   │
│  └→ prompt cache 时间戳                         │
├─────────────────────────────────────────────────┤
│ 本地 JSON 快照 (回退数据源)                      │
│  └→ usage rate_limits (当 stdin 缺失时)         │
├─────────────────────────────────────────────────┤
│ Git CLI (项目信息)                               │
│  ├→ branch, dirty, ahead/behind                 │
│  └→ file change stats                           │
├─────────────────────────────────────────────────┤
│ 系统 API (环境信息)                              │
│  └→ RAM usage (可选)                            │
└─────────────────────────────────────────────────┘
```

---

## 🎨 布局设计 — 三行 + 可选扩展

### Line 1 — 项目身份栏
```
◈ Opus 4.7 │ my-project ⎇ git:(main*) ↑2 ↓1 !M +A ✘D
```

| Segment | 图标 | 变色 | 设计来源 | 说明 |
|---------|------|------|----------|------|
| Model | `◈` | 主题色 | CCometixLine | 简化模型名（models.toml 映射） |
| Provider | — | 专用色 | Claude HUD | Bedrock/Vertex 时显示 |
| Directory | `⌂` | 紫色 | 两者 | 1-3 级可配（`pathLevels`） |
| Git | `⎇` | 分支=青 dirty=黄 | 两者 | 分支 + dirty + ahead/behind + 文件统计 |
| Worktree | `⊕` | 粉色 | CCometixLine | 仅 worktree 内显示 |
| Vim | `⌨` | dim | CCometixLine | 仅 vim 模式时显示 |

**Git 溢出策略**（来自 Claude HUD）：
- `truncate`: 超长分支名截断 + `…`
- `wrap`: 自动换到下一行边界

### Line 2 — 资源监控栏
```
Context ████░░░░░░ 45% (45k/200k) │ Usage ██░░░░░░░░ 25% (resets 1h30m) │ $0.42 │ ⏱ 12m
```

| Segment | 图标 | 变色 | 格式选项 | 设计来源 |
|---------|------|------|----------|----------|
| Context | — | 🟢>50% 🟡20-50% 🔴<20% | percent/tokens/remaining/both | Claude HUD |
| Usage | — | 🟢<50% 🟡50-80% 🔴>80% | bar/compact/text | Claude HUD |
| Weekly | — | 🔴≥80% | 同上 | Claude HUD |
| Cost | `$` | 金色 | $X.XX | Claude HUD（智能隐藏） |
| Duration | `⏱` | dim | relative/absolute/both | Claude HUD |
| Speed | `⚡` | dim | tok/s | Claude HUD |
| Cache | `↻` | dim | 倒计时 | Claude HUD |
| OutputStyle | `❋` | 紫色 | 名称 | Claude HUD |
| Effort | `↯` | 🟢low 🟡med 🔴high | level | Claude HUD |

**Token 明细展开**（来自 Claude HUD）：
- ≥85% 时自动展开：`45% (45k in / 12k out / 8k cache)`

**Merge Groups**（来自 Claude HUD）：
- context + usage 默认合并为一行
- 可配：`mergeGroups: [["context", "usage", "cost"]]`

### Line 3 — 活动追踪栏
```
◐ Edit: auth.ts │ ✓ Read ×3 │ ⌕ Grep ×2
◎ explore [haiku]: Finding auth code (2m 15s)
▸ Fix authentication bug (2/5)  ▪▪▪░░
```

| Segment | 图标 | 变色 | 设计来源 |
|---------|------|------|----------|
| Tools | `◐` `✓` `⌕` `✗` | 活动=橙 完成=dim | Claude HUD |
| Agents | `◎` | 粉色 | Claude HUD |
| Todos | `▸` `▪` | 活动=绿 完成=dim | Claude HUD |

### Line 4 (可选) — 扩展信息
```
CLAUDE.md ×3 │ Rules ×2 │ MCPs ×5 │ Hooks ×1 │ CC v2.1.81
RAM: 4.2 GB / 16 GB (26%)  │  Session: my-dev-session
```

| Segment | 设计来源 |
|---------|----------|
| Config counts | Claude HUD |
| Claude Code version | Claude HUD |
| Memory | Claude HUD |
| Session name | Claude HUD |

---

## 🎭 主题系统（增强版 CCometixLine）

### 内置主题 (8 套)

| 主题 | 风格 | 来源 |
|------|------|------|
| `cometix` | 默认深色，青绿+金 | CCometixLine |
| `gruvbox` | 暖色复古，棕橙 | CCometixLine |
| `dracula` | 现代暗紫 | 两者都有 |
| `nord` | 北欧冷色 | CCometixLine |
| `catppuccin` | 柔和暗粉 | 新增 |
| `tokyo-night` | 东京霓虹 | 新增 |
| `minimal` | 纯文本无图标 | CCometixLine |
| `powerline` | 经典箭头 | CCometixLine |

### 主题文件格式 (TOML)
```toml
# ~/.claude/cc-fusion/themes/cometix.toml
name = "cometix"
display_name = "Cometix Dark"

[icons]
model = "◈"
effort = "↯"
style = "❋"
dir = "⌂"
worktree = "⊕"
git = "⎇"
vim = "⌨"
tool_edit = "◐"
tool_read = "✓"
tool_grep = "⌕"
tool_fail = "✗"
agent = "◎"
todo_active = "▸"
todo_done = "▪"
cost = "$"
time = "⏱"
speed = "⚡"
cache = "↻"
separator = "│"
separator_dot = "·"

[colors]
model = "#8be9fd"

[colors.context]
safe = "#50fa7b"          # 🟢 >50%
warning = "#f1fa8c"       # 🟡 20-50%
critical = "#ff5555"      # 🔴 <20%

[colors.usage]
safe = "#6272a4"
warning = "#ff79c6"
critical = "#ff5555"

[colors.cost]
value = "#f4c542"         # 金色

[colors.git]
branch = "#8be9fd"
dirty = "#f1fa8c"
ahead = "#50fa7b"
behind = "#ff5555"
wrapper = "#6272a4"

[colors.project]
path = "#bd93f9"

[colors.tool]
active = "#ffb86c"
count = "#6272a4"

[colors.agent]
name = "#ff79c6"
model = "#6272a4"
time = "#6272a4"

[colors.todo]
active = "#50fa7b"
done = "#6272a4"
progress = "#f1fa8c"

[colors.label]
dim = "#6272a4"

[colors.provider]
bedrock = "#f4c542"
vertex = "#50fa7b"

[bar]
filled = "█"
empty = "░"
width = 20
```

---

## ⚙️ 配置系统

### 配置文件格式 (TOML)

```toml
# ~/.claude/cc-fusion/config.toml

# === 布局 ===
theme = "cometix"
layout = "expanded"        # expanded | compact
language = "en"            # en | zh

# === 段落开关与顺序 ===
# 省略的条目自动隐藏
element_order = [
    "project", "context", "usage", "cost", "duration",
    "tools", "agents", "todos"
]

# 相邻段落合并为一行
merge_groups = [
    ["context", "usage"]
]

# === Model ===
[model]
enabled = true
simplify = true            # "claude-3-5-sonnet" → "Sonnet 3.5"
show_provider = true       # Bedrock/Vertex 标签

# === Context ===
[context]
enabled = true
format = "both"            # percent | tokens | remaining | both
bar_width = 20
warning_threshold = 50     # 🟡 触发点
critical_threshold = 20    # 🔴 触发点
show_token_breakdown = true
token_breakdown_threshold = 85  # ≥85% 自动展开明细

# === Usage ===
[usage]
enabled = true
bar_enabled = true         # 进度条 vs 文本
compact = false            # 短格式 "5h: 25% (1h30m)"
show_reset_label = true    # "resets in" 前缀
time_format = "relative"   # relative | absolute | both
seven_day_threshold = 80   # ≥80% 才显示周配额

# 外部快照回退（Claude HUD 设计）
[usage.external]
path = ""                  # JSON 快照文件路径
freshness_ms = 300000      # 最大存活时间 5min

# === Cost ===
[cost]
enabled = true
# 智能隐藏：Bedrock/Vertex 自动禁用（来自 Claude HUD）

# === Effort ===
[effort]
enabled = true

# === Output Style ===
[output_style]
enabled = true

# === Duration ===
[duration]
enabled = true
time_format = "relative"

# === Speed ===
[speed]
enabled = false

# === Prompt Cache ===
[prompt_cache]
enabled = false
ttl_seconds = 300          # Pro: 300, Max: 3600

# === Git ===
[git]
enabled = true
show_dirty = true
show_ahead_behind = true
show_file_stats = false
push_warning_threshold = 5
push_critical_threshold = 10
overflow = "truncate"      # truncate | wrap

# === Directory ===
[directory]
enabled = true
levels = 2

# === Worktree ===
[worktree]
enabled = true

# === Tools ===
[tools]
enabled = true
show_counts = true

# === Agents ===
[agents]
enabled = true

# === Todos ===
[todos]
enabled = true

# === Session Name ===
[session_name]
enabled = false

# === Claude Code Version ===
[cc_version]
enabled = false

# === Config Counts ===
[config_counts]
enabled = false            # CLAUDE.md / Rules / MCPs / Hooks

# === Memory ===
[memory]
enabled = false

# === 颜色覆盖（可选，优先级高于主题）===
[colors]
# model = "#ff79c6"
# context = { safe = "#50fa7b", warning = "#f1fa8c", critical = "#ff5555" }

# === 图标覆盖（可选）===
[icons]
# model = "✦"
# effort = "⚡"
```

### Models 配置（来自 CCometixLine）

```toml
# ~/.claude/cc-fusion/models.toml
# 模型名称映射 + 上下文限制
# 基于 model ID 子串匹配

[[models]]
pattern = "glm-4.5"
display_name = "GLM-4.5"
context_limit = 128000

[[models]]
pattern = "kimi-k2"
display_name = "Kimi K2"
context_limit = 128000

[[models]]
pattern = "deepseek-v3"
display_name = "DeepSeek V3"
context_limit = 128000

# 上下文修饰符：独立匹配，可与模型条目组合
# 例如：模型 "Opus 4" + 修饰符 " 1M" = "Opus 4 1M"
[[context_modifiers]]
pattern = "[1m]"
display_suffix = " 1M"
context_limit = 1000000
```

---

## 🏗️ 项目结构

```
cc-fusion/
├── src/
│   ├── main.rs                  # 入口 + CLI + stdin 智能检测
│   ├── lib.rs                   # 库入口
│   │
│   ├── config/
│   │   ├── mod.rs               # 配置加载 (TOML)
│   │   ├── theme.rs             # 主题引擎 (TOML 主题文件)
│   │   ├── preset.rs            # 预设系统 (full/essential/minimal)
│   │   ├── models.rs            # 模型名称映射 (CCometixLine 设计)
│   │   └── i18n.rs              # 国际化 (Claude HUD 设计)
│   │
│   ├── render/
│   │   ├── mod.rs               # 渲染引擎
│   │   ├── line.rs              # 行布局 + merge groups
│   │   ├── segment.rs           # 各 segment 渲染器
│   │   ├── bar.rs               # 进度条 (traffic-light)
│   │   ├── ansi.rs              # ANSI 颜色 (256色 + hex)
│   │   └── overflow.rs          # 分支溢出处理 (trunc/wrap)
│   │
│   ├── data/
│   │   ├── mod.rs               # 数据源抽象层
│   │   ├── stdin.rs             # Claude Code stdin JSON 解析
│   │   ├── transcript.rs        # JSONL transcript 解析 (工具/Agent/TODO)
│   │   ├── context_cache.rs     # Context token + cache 倒计时
│   │   ├── external_usage.rs    # 外部 usage JSON 快照回退
│   │   ├── cost.rs              # 费用 + 智能隐藏逻辑
│   │   ├── effort.rs            # Effort 等级检测
│   │   ├── speed.rs             # 输出速度计算
│   │   ├── git.rs               # Git 信息采集
│   │   └── system.rs            # 系统信息 (RAM)
│   │
│   ├── tui/
│   │   ├── mod.rs               # TUI 配置界面 (CCometixLine)
│   │   ├── preview.rs           # 实时预览
│   │   ├── widgets.rs           # TUI 组件
│   │   └── menu.rs              # 无 stdin 时的主菜单
│   │
│   └── enhance/
│       ├── mod.rs               # Claude Code 增强
│       ├── patcher.rs           # 补丁系统 (禁用警告等)
│       └── backup.rs            # 自动备份管理
│
├── themes/                      # 内置主题
│   ├── cometix.toml
│   ├── gruvbox.toml
│   ├── dracula.toml
│   ├── nord.toml
│   ├── catppuccin.toml
│   ├── tokyo-night.toml
│   ├── minimal.toml
│   └── powerline.toml
│
├── locales/                     # i18n 翻译
│   ├── en.toml
│   └── zh.toml
│
├── Cargo.toml
├── README.md
└── README.zh.md
```

---

## 📦 安装 & 使用

### 安装

```bash
# npm 全局 (推荐)
npm install -g @cometix/cc-fusion

# 或手动下载二进制
# → GitHub Releases: linux-x64, linux-x64-static, macos-arm64, macos-x64, windows-x64
```

### Claude Code 配置

```json
{
  "statusLine": {
    "type": "command",
    "command": "cc-fusion",
    "padding": 0
  }
}
```

### CLI 命令

```bash
# 无 stdin → 显示主菜单 (CCometixLine 设计)
cc-fusion

# TUI 配置面板 (CCometixLine 设计)
cc-fusion --config

# 主题覆盖
cc-fusion --theme dracula

# 预设切换
cc-fusion --preset full
cc-fusion --preset essential
cc-fusion --preset minimal

# 补丁系统 (CCometixLine 设计)
cc-fusion --patch /path/to/claude-code/cli.js

# 检查配置
cc-fusion --check

# 初始化默认配置
cc-fusion --init
```

---

## 📋 设计决策溯源

每个设计选择都标注来源：

| 决策 | 选择 | 来源 | 原因 |
|------|------|------|------|
| 语言 | Rust | CCometixLine | 性能 + 跨平台单文件 |
| 配置格式 | TOML | CCometixLine | 比 JSON 更易手写 |
| 主题系统 | TOML 文件 | CCometixLine | 可扩展 + 社区友好 |
| stdin 智能检测 | is_terminal() | CCometixLine | 无数据时显示菜单 |
| TUI 配置 | 交互式面板 | CCometixLine | 实时预览 > 手写配置 |
| 模型映射 | pattern 匹配 | CCometixLine | 支持第三方模型 |
| 补丁系统 | 自动备份+补丁 | CCometixLine | Claude Code 增强 |
| Transcript 解析 | JSONL 读取 | Claude HUD | 工具/Agent/TODO 追踪 |
| Traffic-Light | 绿黄红 | Claude HUD | 统一视觉语言 |
| Token 明细 | ≥85% 展开 | Claude HUD | 知道钱花哪 |
| 外部 Usage | JSON 快照回退 | Claude HUD | stdin 缺失时兜底 |
| Element Order | 数组排序 | Claude HUD | 灵活控制显示顺序 |
| Merge Groups | 相邻合并 | Claude HUD | 节省行数 |
| i18n | en/zh 切换 | Claude HUD | 中文用户友好 |
| Context 格式 | 4 种选项 | Claude HUD | 不同场景不同需求 |
| Git 溢出 | trunc/wrap | Claude HUD | 长分支名处理 |
| 智能隐藏 | Cost/Usage | Claude HUD | 避免误导信息 |
| 7 天阈值 | ≥80% 显示 | Claude HUD | 避免信息过载 |
| Cache 倒计时 | TTL 显示 | Claude HUD | 缓存管理 |
| Speed 追踪 | tok/s | Claude HUD | 性能感知 |

---

*设计日期: 2026-05-10*
*版本: v3 — 深度融合版*
*设计者: Tekkie for Amin*
