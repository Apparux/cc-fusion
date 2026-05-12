# TUI Configuration Interface with Real-time Preview

## Goal

Implement an interactive Terminal User Interface (TUI) for cc-fusion configuration that provides real-time preview of configuration effects, inspired by CCometixLine. Users should be able to navigate between panels (Preview, Themes, Segments, Settings), modify configuration options interactively, and see immediate visual feedback with emoji/Unicode icon support.

## What I already know

### Current Architecture
* **Config system** (`src/config.ts`): Cascading config loading (defaults → package → project → user → env), inline TOML parser for themes, supports themes/presets/i18n
* **Rendering engine** (`src/render.ts`): Element-based architecture with 11 renderers (model, dir, git, context, usage, cost, duration, effort, tools, agents, todos), composes elements into lines based on preset
* **Current configure flow** (`src/configure.ts`): CLI-based sequential Q&A using readline, saves to `~/.claude/cc-fusion/config.json`
* **No TUI library**: Project currently has zero external runtime dependencies, only TypeScript dev dependencies
* **Themes**: 6 built-in themes (cometix, hud, neon, gruvbox, dracula, nord) with ANSI colors and Unicode/emoji icons
* **Presets**: 3 built-in presets (full, essential, minimal) defining multi-line layouts
* **Languages**: en, zh with i18n support

### Reference Implementation
* CCometixLine (https://github.com/Haleclipse/CCometixLine) provides the target UX: multi-panel layout with Preview, Themes, Segments, Settings panels
* User screenshot shows emoji icon display in Preview panel

### Technical Constraints
* Node.js >=18 required
* TypeScript codebase
* Must maintain existing config file format and locations
* Must support existing themes/presets/i18n system
* Terminal rendering with ANSI colors and Unicode/emoji

## Assumptions (temporary)

* TUI will supplement (not replace) the existing CLI configure flow
* Real-time preview means rendering the statusline with current config changes before saving
* Multi-panel layout requires a TUI library (blessed, ink, or similar)
* Keyboard navigation is the primary interaction method
* Preview panel should render using the same `render()` function from `src/render.ts`

## Open Questions

### Blocking Questions
* **TUI library choice**: Which Node.js TUI library best fits the requirements? (blessed, ink, react-blessed, etc.)
* **Integration approach**: Replace `src/configure.ts` entirely, or add as separate command (`cc-fusion tui`)?
* **Scope boundary**: MVP should include which panels? (Preview + Themes + Settings, or all 4 panels from reference?)

### Preference Questions
* **Keyboard shortcuts**: Which navigation keys? (arrow keys, vim-style hjkl, tab/shift-tab, etc.)
* **Preview data source**: Use mock stdin data, or allow loading from saved session?
* **Save behavior**: Auto-save on change, or explicit save action?

## Requirements (evolving)

### Core Requirements
* Multi-panel TUI layout with keyboard navigation
* Real-time preview panel showing statusline rendering with current config
* Theme selection panel (6 themes: cometix, hud, neon, gruvbox, dracula, nord)
* Preset selection panel (3 presets: full, essential, minimal)
* Settings panel for all config options
* Emoji/Unicode icon display support in preview
* Save configuration to `~/.claude/cc-fusion/config.json`
* Load existing configuration on startup

### Four Panel Layout (Reference CCometixLine)
1. **Preview Panel** (top, dynamic height 3-8 lines)
   - Real-time statusline rendering with mock data
   - Shows current theme + preset + settings effect
   - Emoji/Unicode icon support

2. **Theme Selector** (below preview, dynamic height)
   - List of 6 themes with descriptions
   - Quick switch with number keys (1-6)
   - Visual indicator for current theme

3. **Preset Selector** (left side of content area, ~30% width)
   - List of 3 presets with descriptions
   - Shows line layout for each preset
   - Visual indicator for current preset

4. **Settings Panel** (right side of content area, ~70% width)
   - **Language**: en / zh
   - **Show Transcript**: true / false (parse transcript for tools/agents/todos)
   - **Bar Width**: 5-60 (progress bar width)
   - **Usage Threshold**: 1-100 (when to show usage display)
   - **Token Breakdown Threshold**: 1-100 (when to show token breakdown)
   - **Elements** (toggle each):
     - usage
     - cost
     - duration
     - effort
     - tools
     - agents
     - todos
   - **Hide Cost For**: bedrock, vertex (array, not editable in MVP)

### Technical Requirements
* Reuse existing `render()` function for preview generation
* Reuse existing `loadConfig()`, `loadTheme()`, `loadPreset()` functions
* Maintain compatibility with existing config file format
* Support all 6 built-in themes and 3 built-in presets
* Handle terminal resize events
* Debounce preview updates (150ms)
* Install cleanup handlers (cursor show/hide, exit handlers)

## Acceptance Criteria (evolving)

### Layout & Navigation
* [ ] TUI launches with four-panel layout (Preview, Theme Selector, Preset Selector, Settings)
* [ ] Preview panel renders statusline with emoji/Unicode icons correctly
* [ ] User can navigate between panels using Tab key
* [ ] User can navigate within panels using ↑↓ arrow keys
* [ ] User can select/toggle options using Enter key
* [ ] Quick theme switch with number keys 1-6 works
* [ ] Help footer shows context-aware keyboard shortcuts

### Real-time Preview
* [ ] Changing theme updates preview in real-time (debounced 150ms)
* [ ] Changing preset updates preview in real-time (debounced 150ms)
* [ ] Changing language updates preview in real-time
* [ ] Toggling showTranscript updates preview
* [ ] Changing barWidth updates preview
* [ ] Changing thresholds updates preview
* [ ] Toggling elements updates preview

### Configuration Persistence
* [ ] Configuration saves to `~/.claude/cc-fusion/config.json` on S key
* [ ] Existing config loads correctly on startup
* [ ] Config file format matches existing schema
* [ ] All 6 themes supported
* [ ] All 3 presets supported
* [ ] All settings editable

### Robustness
* [ ] TUI handles terminal resize gracefully
* [ ] TUI exits cleanly on Esc/Q (cursor restored, no artifacts)
* [ ] Cleanup handlers prevent terminal corruption on crash
* [ ] Works in iTerm2, Terminal.app, and other modern terminals
* [ ] Falls back gracefully if terminal too narrow (< 80 cols)

## Definition of Done (team quality bar)

* TypeScript compiles without errors
* Smoke test with `node dist/index.js tui` (or chosen command) launches TUI
* Manual testing confirms all panels and navigation work
* Preview rendering matches existing statusline output format
* Config file written matches existing JSON schema
* README updated with TUI usage instructions
* No new runtime dependencies added without justification

## Decision (ADR-lite)

**Context**: Need to choose between neo-blessed (fast development, 10-15 deps) vs custom low-level (minimal deps, slower development)

**Decision**: Custom low-level approach with ansi-escapes, chalk, cli-cursor, strip-ansi

**Consequences**:
- Maintains minimal dependency footprint (8-12 packages)
- First-class TypeScript support
- 2-3x longer development time accepted
- Must implement layout engine, focus management, keyboard handling manually
- Full control over behavior, no framework lock-in

---

**Context**: How to integrate TUI with existing CLI configure flow

**Decision**: 
- Rename existing `cc-fusion configure` → `cc-fusion init` (initialization/first-time setup)
- New TUI uses `cc-fusion config` command
- Keep `init` as CLI-only fallback for non-TTY environments

**Consequences**:
- Clear command semantics: `init` for first-time, `config` for interactive configuration
- Breaking change for users who use `configure` command (document in migration guide)
- TUI becomes the primary configuration interface

---

**Context**: MVP scope - core three panels vs complete four panels

**Decision**: Complete four-panel layout (Preview, Theme Selector, Preset Selector, Settings)

**Consequences**:
- Longer development time (full feature set)
- Matches CCometixLine reference implementation
- All current config options editable in TUI
- Better user experience with dedicated preset panel

## Out of Scope (explicit)

* Custom theme creation UI (users can still manually edit TOML files)
* Custom preset creation UI (users can still manually edit JSON files)
* Mouse support (keyboard-only for MVP)
* Undo/redo for configuration changes
* Configuration import/export
* Multi-language TUI labels (TUI itself in English, but config lang setting affects preview)

## Technical Notes

### Files to modify/create
* `src/index.ts` - Add TUI command dispatch
* `src/tui.ts` (new) - Main TUI entry point
* `src/tui/` (new directory) - TUI components and layout

### Research needed
* TUI library comparison (blessed vs ink vs others)
* CCometixLine implementation details
* Best practices for real-time preview in TUI
* Mock stdin data structure for preview rendering

### Constraints
* Must work in standard terminal emulators (iTerm2, Terminal.app, etc.)
* Must handle limited terminal width gracefully
* Must not break existing CLI configure flow
* Must maintain zero runtime dependencies if possible (or justify additions)

## Research References

* [`research/tui-libraries.md`](research/tui-libraries.md) — Comparison of 5 TUI approaches: ink (React-based, heavy), blessed/neo-blessed (mature widgets), terminal-kit (moderate), custom low-level (minimal deps)
* [`research/ccometixline-analysis.md`](research/ccometixline-analysis.md) — CCometixLine uses Rust ratatui+crossterm; component-based architecture with dynamic layouts, mock data preview, priority-based keyboard handling
* [`research/realtime-preview-patterns.md`](research/realtime-preview-patterns.md) — Three re-rendering strategies (overwrite-in-place, double-buffering, alt screen), debouncing (150ms), mock data injection, cleanup handlers

## Feasible Approaches

### Approach A: neo-blessed (Recommended for Fast Development)

**How it works:**
- Use `neo-blessed` TUI library (more active fork of blessed)
- Rich widget system: `blessed.box()` for panels, `blessed.list()` for navigation, `blessed.text()` for preview
- Built-in keyboard handling and focus management
- Component-based architecture similar to CCometixLine pattern

**Implementation:**
```bash
npm install neo-blessed
npm install --save-dev @types/blessed
```

**Pros:**
- Fast development: mature widget system out-of-the-box
- Excellent keyboard/mouse handling built-in
- Battle-tested architecture
- Relatively light dependencies (~10-15 packages)
- Multi-panel layout with minimal code

**Cons:**
- Breaks "zero runtime dependencies" principle (adds 10-15 deps)
- TypeScript experience fair but not first-class (community types)
- Imperative API (not modern React-style)
- Maintenance uncertainty (community-driven fork)

**Trade-offs:**
- Accept 10-15 dependencies for 2-3x faster development
- Accept fair TypeScript support for proven stability
- Can migrate to custom solution later if needed

---

### Approach B: Custom Low-Level (Recommended for Minimal Dependencies)

**How it works:**
- Build custom TUI using low-level terminal control libraries
- Stack: `ansi-escapes` (cursor control), `chalk` (colors), `cli-cursor` (visibility), `strip-ansi` (width calculation)
- Manual layout engine, keyboard handling via Node.js `readline`
- Overwrite-in-place rendering strategy with debouncing

**Implementation:**
```bash
npm install ansi-escapes chalk cli-cursor strip-ansi
```

**Pros:**
- Smallest dependency footprint (8-12 packages, all tiny)
- First-class TypeScript support
- Complete control over behavior
- No framework lock-in
- All dependencies actively maintained

**Cons:**
- High development time (2-3x vs framework)
- Must implement layout engine, focus management, input handling manually
- Higher bug surface area
- More testing burden

**Trade-offs:**
- Accept higher development cost for minimal dependencies
- Accept more manual work for full control
- Accept longer timeline for cleaner architecture

---

### Approach C: ink (NOT Recommended)

**How it works:**
- React-based TUI framework with JSX components
- Flexbox layout model, hooks for state/input
- Best-in-class TypeScript and developer experience

**Pros:**
- Excellent TypeScript support
- Best developer experience (React paradigm)
- Best testing story
- Most active maintenance (Vercel-backed)

**Cons:**
- **Heavy dependencies (30-50 packages) — Deal breaker**
- Larger bundle size (React runtime + reconciler)
- Requires React knowledge
- Overkill for configuration UI

**Trade-offs:**
- Would require abandoning "minimal dependencies" principle entirely

---

## Implementation Strategy (Approach-Agnostic)

Regardless of library choice, the implementation follows this pattern:

### 1. Component Architecture
- **Preview Panel**: Renders statusline using existing `render()` function with mock stdin data
- **Theme Selector**: List of 6 themes with visual preview
- **Preset Selector**: List of 3 presets (full, essential, minimal)
- **Settings Panel**: Config options (lang, showTranscript, barWidth, thresholds, elements)
- **Help Footer**: Context-aware keyboard shortcuts

### 2. Real-Time Preview Strategy
- Generate mock stdin data (model, context, usage, cost, git, tools)
- Call existing `render(rc: RenderContext)` on config changes
- Debounce updates (150ms) to avoid flicker
- Pre-load all themes/presets before entering TUI

### 3. Keyboard Navigation
- `↑↓`: Navigate within panel
- `Tab`: Switch between panels
- `Enter`: Select/toggle option
- `1-6`: Quick theme switch
- `S`: Save config
- `Esc`/`Q`: Quit

### 4. Configuration Persistence
- Load existing config from `~/.claude/cc-fusion/config.json` on startup
- Save on `S` key or explicit save action
- Maintain compatibility with existing config file format

### 5. Integration Point
- Add new command: `cc-fusion tui` or `cc-fusion configure --tui`
- Keep existing CLI configure flow as fallback
- Detect TTY capability and fall back to CLI if not supported

---

## Mock Data Structure

```typescript
const MOCK_STDIN: StdinData = {
  model: { display_name: 'Claude Opus 4.7', id: 'claude-opus-4-7' },
  context_window: {
    used_percentage: 45,
    context_window_size: 200000,
    total_input_tokens: 60000,
    total_output_tokens: 30000,
    current_usage: {
      input_tokens: 28000,
      output_tokens: 12000,
      cache_creation_input_tokens: 8000,
      cache_read_input_tokens: 40000,
    },
  },
  cost: { total_cost_usd: 0.42 },
  cwd: '/Users/example/project',
};

const MOCK_GIT: GitStatus = {
  branch: 'main',
  dirty: true,
  ahead: 2,
  behind: 0,
  staged: 3,
  unstaged: 1,
  untracked: 2,
};

const MOCK_TOOLS: ToolsData = {
  totalCalls: 15,
  edits: 5,
  reads: 8,
  greps: 2,
  bash: 3,
  webFetches: 1,
  agents: 1,
  lastEditFile: 'src/config.ts',
  lastAgent: 'research',
  todos: { done: 2, total: 5 },
};
```
