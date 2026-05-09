# CC-Fusion

> **Claude Code Statusline** — The beauty of [CCometixLine](https://github.com/Cometix/CCometixLine) fused with the full functionality of [Claude HUD](https://github.com/claude-hud/claude-hud).

A TypeScript plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that renders a rich, colorful 3-line statusline directly in your terminal — combining gorgeous Nerd Font icons, TOML themes, and traffic-light health indicators with deep transcript parsing, token breakdowns, and smart cost hiding.

🌐 English | [中文文档](README.zh.md)

---

## 📸 Preview

```
◈ Opus 4.6 │ ⌂ ~/project │ ⎇ main✱ +2 ~1
◈ Ctx ████████████████░░░░ 82%  I120k O35k W8k R40k
◆ $0.42  ◷ 12m  ↯ high
◐ Edit: auth.ts ×3  ⊙ Read ×8  ⌕ Grep ×2  ⊕ 1  ☑ 3/4
```

```
◈ Sonnet 4.5 │ ⌂ ~/api-server │ ⎇ feature/auth ↑3
◈ Ctx ██████░░░░░░░░░░░░░░ 31%  ▦ Use ██░░░░░░░░░░░░░░░░░░ 12%
◆ $0.08  ◷ 3m  ↯ low
◐ Edit: handler.go  ⊙ Read ×2  ⌕ Grep ×1
```

### Preset Variants

**Full** (default — all 3 lines):
```
◈ Opus 4.6 │ ⌂ ~/my-app │ ⎇ main✱ ↑1
◈ Ctx ████████████████░░░░ 82%  ▦ Use ████████░░░░░░░░░░░░ 42%  ◆ $0.31  ◷ 8m  ↯ medium
◐ Edit: index.ts ×2  ⊙ Read ×5  ⌕ Grep ×1  ⊕ 1  ☐ 2/4
```

**Essential** (2 lines — model + git, context + usage + cost):
```
◈ Opus 4.6 │ ⎇ main✱
◈ Ctx ████████████████░░░░ 82%  ▦ Use ████████░░░░░░░░░░░░ 42%  ◆ $0.31
```

**Minimal** (1 line — model + context):
```
◈ Opus 4.6 │ ◈ Ctx ██████░░░░░░░░░░░░░░ 31%
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** ≥ 18
- **TypeScript** (dev dependency)
- **Claude Code** CLI installed
- **Nerd Font** (for icons) — recommended: [JetBrains Mono Nerd Font](https://www.nerdfonts.com/)

### Quick Install (Recommended)

No npm needed — clone and go:

```bash
# Clone to ~/.claude/cc-fusion
git clone https://github.com/CanCanNeedNei/cc-fusion.git ~/.claude/cc-fusion
```

Then configure Claude Code (see below). That's it!

### Manual Install (from source)

```bash
# Clone
git clone https://github.com/CanCanNeedNei/cc-fusion.git
cd cc-fusion

# Install & build
npm install
npm run build
```

### Configure Claude Code

Add to your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/cc-fusion/dist/index.js",
    "padding": 0
  }
}
```

Restart Claude Code and you're done! 🎉

---

## ⚙️ Configuration

### Main Config (`config.json`)

Create `config.json` in the project root:

```json
{
  "theme": "cometix",
  "preset": "full",
  "lang": "en",
  "hideCostFor": ["bedrock", "vertex"],
  "usageThreshold": 80,
  "tokenBreakdownThreshold": 85,
  "barWidth": 20,
  "showTranscript": true
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `theme` | `string` | `"cometix"` | Theme name (matches `themes/<name>.toml`) |
| `preset` | `string` | `"full"` | Display preset: `full`, `essential`, `minimal` |
| `lang` | `string` | `"en"` | Language: `en` or `zh` |
| `hideCostFor` | `string[]` | `["bedrock","vertex"]` | Providers where cost is hidden when $0 |
| `usageThreshold` | `number` | `80` | Only show usage bar when ≥ this % |
| `tokenBreakdownThreshold` | `number` | `85` | Show I/O/cache breakdown when ≥ this % |
| `barWidth` | `number` | `20` | Progress bar width in characters |
| `showTranscript` | `boolean` | `true` | Parse transcript for tools/agents/todos |

### Presets

Presets control which elements appear and on which line. Each preset is a JSON file with a `lines` array of arrays:

```json
{
  "name": "full",
  "lines": [
    ["model", "dir", "git"],
    ["context", "usage", "cost", "duration", "effort"],
    ["tools", "agents", "todos"]
  ]
}
```

**Available elements:**

| Element | Description |
|---------|-------------|
| `model` | Simplified model name (◈ Opus 4.6) |
| `dir` | Shortened working directory |
| `git` | Branch + dirty + ahead/behind + file stats |
| `context` | Context progress bar + % (with traffic-light) |
| `usage` | Usage bar + % (only shown above threshold) |
| `cost` | Session cost in USD |
| `duration` | Session duration estimate |
| `effort` | Effort level with color coding |
| `tools` | Tool call breakdown (Edit, Read, Grep, etc.) |
| `agents` | Number of sub-agents spawned |
| `todos` | Todo progress (done/total) |

### Built-in Presets

| Preset | Lines | Elements |
|--------|-------|----------|
| `full` | 3 | All elements |
| `essential` | 2 | model, git, context, usage, cost |
| `minimal` | 1 | model, context |

---

## 🎨 Theme Customization

Themes are TOML files in the `themes/` directory. Each theme defines a color palette and icon set.

### Theme Structure

```toml
name = "my-theme"

[colors]
modelColor = "cyan"
dirColor = "blue"
gitColor = "green"
contextColor = "cyan"
usageColor = "blue"
costColor = "gold"
effortColor = "yellow"
toolColor = "magenta"
agentColor = "brightMagenta"
todoColor = "green"
separatorColor = "dim"
barFill = "cyan"
barEmpty = "dim"

[icons]
model = "◈"
git = "⎇"
gitDirty = "✱"
dir = "⌂"
effort = "↯"
tool = "◐"
grep = "⌕"
read = "⊙"
write = "✎"
bash = "›_"
agent = "⊕"
todo = "☐"
todoDone = "☑"
cost = "◆"
clock = "◷"
context = "◈"
usage = "▦"
web = "⊕"
separator = "│"
```

### Available Color Names

| Name | ANSI Code | Preview |
|------|-----------|---------|
| `red` | `\x1b[31m` | 🔴 |
| `green` | `\x1b[32m` | 🟢 |
| `yellow` | `\x1b[33m` | 🟡 |
| `blue` | `\x1b[34m` | 🔵 |
| `magenta` | `\x1b[35m` | 🟣 |
| `cyan` | `\x1b[36m` | 🩵 |
| `white` | `\x1b[37m` | ⚪ |
| `brightBlue` | `\x1b[94m` | 💠 |
| `brightMagenta` | `\x1b[95m` | 💜 |
| `orange` | `\x1b[38;5;208m` | 🟠 |
| `gold` | `\x1b[38;5;220m` | 🟨 |

### Creating a Custom Theme

1. Copy an existing theme: `cp themes/cometix.toml themes/my-theme.toml`
2. Edit colors and icons
3. Set `"theme": "my-theme"` in `config.json`

---

## 🚦 Traffic-Light System

All health indicators use a unified traffic-light coloring:

| Metric | 🟢 Green | 🟡 Yellow | 🔴 Red |
|--------|----------|-----------|--------|
| Context | > 50% | 20–50% | < 20% |
| Usage | < 50% | 50–80% | > 80% |
| Effort | low/none | medium | high |

> **Note:** For context, green means "plenty of room" (inverted from usage). This is intentional — high context % is good (you're using what you have), but high usage % means you're running low on budget.

---

## 🔍 Data Sources

### 1. Claude Code Stdin JSON

The primary data source. Claude Code pipes JSON to stdin on every prompt, containing:
- Model info (name, ID)
- Context window (input/output/cache tokens, max size)
- Cost (total USD)
- Effort level
- Working directory, git branch/status
- Session ID

### 2. Transcript JSONL

Parsed from `~/.claude/projects/*/sessions/*/transcript.jsonl`:
- Tool calls (Edit, Read, Grep, Bash, etc.)
- Agent spawn count
- Todo progress (`[x]` / `[ ]` patterns)
- Session duration (first → last timestamp)

### 3. Git CLI

Collected via `git` commands:
- Current branch
- Dirty state (any uncommitted changes)
- Ahead/behind upstream
- Staged, unstaged, untracked file counts

---

## 📁 File Structure

```
cc-fusion/
├── package.json          # Project config
├── tsconfig.json         # TypeScript config
├── src/
│   ├── index.ts          # Entry: read stdin, parse, render, write stdout
│   ├── types.ts          # TypeScript interfaces
│   ├── config.ts         # Config + TOML theme + preset loading
│   ├── stdin.ts          # Parse Claude Code stdin JSON
│   ├── transcript.ts     # Parse transcript JSONL
│   ├── git.ts            # Git info via child_process
│   ├── render.ts         # Main render engine (composes all elements)
│   ├── context.ts        # Context bar + traffic-light
│   ├── usage.ts          # Usage bar + traffic-light
│   ├── cost.ts           # Cost display + smart hiding
│   ├── effort.ts         # Effort level + color
│   ├── i18n.ts           # Internationalization loader
│   └── utils.ts          # ANSI colors, progress bar, helpers
├── themes/
│   ├── cometix.toml      # Cyan + gold (default)
│   ├── gruvbox.toml      # Warm retro
│   ├── dracula.toml      # Modern purple
│   └── nord.toml         # Nordic cold
├── presets/
│   ├── full.json         # All 3 lines
│   ├── essential.json    # 2 lines
│   └── minimal.json      # 1 line
├── i18n/
│   ├── en.json           # English
│   └── zh.json           # Chinese
└── README.md
```

---

## 🌍 国际化 / Internationalization

CC-Fusion supports English and Chinese out of the box. Set `"lang": "zh"` in `config.json` to switch.

### Adding a New Language

1. Copy `i18n/en.json` to `i18n/<lang>.json`
2. Translate the values
3. Set `"lang": "<lang>"` in `config.json`

---

## 🛠️ Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Test with sample stdin
echo '{"model":{"display_name":"Opus 4.6","id":"claude-opus-4-6"},"context_window":{"input_tokens":45000,"output_tokens":12000},"max_context_window_size":200000,"cost":{"total_cost_usd":0.42},"effortLevel":"high","cwd":"/home/user/project","sessionId":"test123"}' | node dist/index.js
```

---

## 📄 License

MIT

---

## 🙏 Credits

- [CCometixLine](https://github.com/Cometix/CCometixLine) — Visual design, TOML themes, Nerd Font icons, preset system
- [Claude HUD](https://github.com/claude-hud/claude-hud) — Transcript parsing, token breakdowns, smart cost hiding, i18n, element ordering
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — The AI coding tool this plugin extends
