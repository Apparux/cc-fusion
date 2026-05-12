# Research: Real-time Preview Patterns in TUI Applications

- **Query**: Best practices and patterns for implementing real-time preview in Terminal User Interface (TUI) applications
- **Scope**: Mixed (internal codebase analysis + external best practices)
- **Date**: 2026-05-12

## Current Codebase Architecture

### Existing Rendering Pattern

**File**: `src/index.ts` (lines 128-187)
- **Pattern**: One-shot stdin → parse → render → stdout
- **Flow**: Read JSON from stdin, collect data, render once, exit
- **No state**: Stateless execution model

**File**: `src/configure.ts` (lines 54-82)
- **Pattern**: Readline-based sequential prompts
- **Flow**: Ask question → wait for answer → ask next question
- **No preview**: User sees final result only after all choices made

**File**: `src/render.ts` (lines 168-192)
- **Pattern**: Functional rendering with element registry
- **Architecture**: `ELEMENT_RENDERERS` map → compose lines → join with newlines
- **Output**: Single string written to stdout

### Terminal Output Primitives

**File**: `src/utils.ts` (lines 9-24)
- ANSI escape codes available: colors, bold, dim, reset
- No cursor control codes (move, clear, save/restore position)
- No screen manipulation (clear screen, clear line)

**File**: `src/configure.ts` (lines 94-112, 157-175)
- Uses `process.stdout.write()` for output
- Uses `readline.createInterface()` for input
- Sequential, blocking interaction model

## TUI Real-time Preview Patterns

### 1. Terminal Control Primitives

Real-time preview requires additional ANSI escape sequences beyond what cc-fusion currently uses:

```typescript
// Cursor control
const CURSOR = {
  hide: '\x1b[?25l',
  show: '\x1b[?25h',
  up: (n: number) => `\x1b[${n}A`,
  down: (n: number) => `\x1b[${n}B`,
  toColumn: (n: number) => `\x1b[${n}G`,
  savePosition: '\x1b[s',
  restorePosition: '\x1b[u',
};

// Screen control
const SCREEN = {
  clearLine: '\x1b[2K',
  clearScreen: '\x1b[2J',
  clearFromCursor: '\x1b[0J',
  moveTo: (row: number, col: number) => `\x1b[${row};${col}H`,
};
```

### 2. Re-rendering Strategies

#### Strategy A: Overwrite-in-place (Recommended for simple previews)

**Pattern**: Clear previous output, redraw at same position

```typescript
interface PreviewState {
  lastLineCount: number;
  isActive: boolean;
}

function renderPreview(content: string[], state: PreviewState): void {
  // Clear previous preview
  if (state.lastLineCount > 0) {
    process.stdout.write(CURSOR.up(state.lastLineCount));
    for (let i = 0; i < state.lastLineCount; i++) {
      process.stdout.write(SCREEN.clearLine + '\n');
    }
    process.stdout.write(CURSOR.up(state.lastLineCount));
  }
  
  // Render new preview
  process.stdout.write(content.join('\n') + '\n');
  state.lastLineCount = content.length;
}
```

**Pros**: Simple, works in most terminals, minimal state
**Cons**: Flicker on slow terminals, doesn't handle terminal resize well

#### Strategy B: Double-buffering with diff

**Pattern**: Calculate diff between old and new output, update only changed lines

```typescript
interface BufferedPreview {
  previousLines: string[];
  currentLines: string[];
}

function renderDiff(preview: BufferedPreview): void {
  const maxLines = Math.max(preview.previousLines.length, preview.currentLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = preview.previousLines[i] || '';
    const newLine = preview.currentLines[i] || '';
    
    if (oldLine !== newLine) {
      process.stdout.write(CURSOR.toColumn(0));
      process.stdout.write(SCREEN.clearLine);
      process.stdout.write(newLine);
    }
    if (i < maxLines - 1) {
      process.stdout.write('\n');
    }
  }
  
  preview.previousLines = [...preview.currentLines];
}
```

**Pros**: Reduces flicker, more efficient for partial updates
**Cons**: More complex state management, requires line-by-line tracking

#### Strategy C: Alternate screen buffer

**Pattern**: Use terminal's alternate screen buffer (like vim/less)

```typescript
const ALT_SCREEN = {
  enter: '\x1b[?1049h',
  exit: '\x1b[?1049l',
};

function enterPreviewMode(): void {
  process.stdout.write(ALT_SCREEN.enter);
  process.stdout.write(CURSOR.hide);
}

function exitPreviewMode(): void {
  process.stdout.write(CURSOR.show);
  process.stdout.write(ALT_SCREEN.exit);
}
```

**Pros**: Clean separation, no interference with main terminal, full control
**Cons**: More invasive, requires cleanup on exit, not all terminals support it

### 3. Handling Terminal Width/Height Constraints

#### Terminal Size Detection

```typescript
interface TerminalSize {
  columns: number;
  rows: number;
}

function getTerminalSize(): TerminalSize {
  return {
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
  };
}

// Listen for resize events
process.stdout.on('resize', () => {
  const size = getTerminalSize();
  // Trigger re-render with new constraints
  schedulePreviewUpdate(size);
});
```

#### Content Truncation Strategies

**Strategy 1: Truncate with ellipsis**
```typescript
function truncateLine(line: string, maxWidth: number): string {
  // Account for ANSI codes (don't count them in width)
  const visibleLength = line.replace(/\x1b\[[0-9;]*m/g, '').length;
  if (visibleLength <= maxWidth) return line;
  
  // Truncate visible content, preserve trailing ANSI reset
  const truncated = line.slice(0, maxWidth - 1);
  return truncated + '…' + ANSI.reset;
}
```

**Strategy 2: Wrap long lines**
```typescript
function wrapLine(line: string, maxWidth: number): string[] {
  const words = line.split(' ');
  const wrapped: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxWidth) {
      wrapped.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) wrapped.push(currentLine.trim());
  
  return wrapped;
}
```

**Strategy 3: Viewport scrolling**
```typescript
interface Viewport {
  offsetRow: number;
  visibleRows: number;
}

function renderViewport(allLines: string[], viewport: Viewport): string[] {
  const start = viewport.offsetRow;
  const end = start + viewport.visibleRows;
  return allLines.slice(start, end);
}
```

### 4. Mock Data Strategies for Preview Rendering

#### Pattern A: Sample data injection

**File**: Current codebase uses real stdin data (`src/stdin.ts`)

For preview mode, inject mock data:

```typescript
interface MockStdinData {
  model: { display_name: string; id: string };
  context_window: {
    used_percentage: number;
    context_window_size: number;
    total_input_tokens: number;
    total_output_tokens: number;
  };
  cost: { total_cost_usd: number };
  cwd: string;
}

const MOCK_SAMPLES: Record<string, MockStdinData> = {
  low_usage: {
    model: { display_name: 'Claude Opus 4.7', id: 'claude-opus-4-7' },
    context_window: {
      used_percentage: 25,
      context_window_size: 200000,
      total_input_tokens: 30000,
      total_output_tokens: 20000,
    },
    cost: { total_cost_usd: 0.42 },
    cwd: '/Users/example/project',
  },
  high_usage: {
    model: { display_name: 'Claude Sonnet 4.6', id: 'claude-sonnet-4-6' },
    context_window: {
      used_percentage: 85,
      context_window_size: 200000,
      total_input_tokens: 140000,
      total_output_tokens: 30000,
    },
    cost: { total_cost_usd: 1.23 },
    cwd: '/Users/example/large-project',
  },
};
```

#### Pattern B: Parameterized mock generation

```typescript
function generateMockData(scenario: 'minimal' | 'typical' | 'heavy'): StdinData {
  const baseData = { /* ... */ };
  
  switch (scenario) {
    case 'minimal':
      return { ...baseData, context_window: { used_percentage: 10, /* ... */ } };
    case 'typical':
      return { ...baseData, context_window: { used_percentage: 50, /* ... */ } };
    case 'heavy':
      return { ...baseData, context_window: { used_percentage: 90, /* ... */ } };
  }
}
```

#### Pattern C: User's actual config + synthetic runtime data

```typescript
function createPreviewContext(userConfig: Config, theme: Theme, preset: Preset): RenderContext {
  // Use real user config, but synthetic runtime data
  return {
    stdin: generateMockData('typical'),
    git: { branch: 'main', dirty: false, ahead: 0, behind: 0, staged: 0, unstaged: 0, untracked: 0 },
    tools: { totalCalls: 0, edits: 0, reads: 0, greps: 0, bash: 0, webFetches: 0, agents: 0, todos: { done: 0, total: 0 }, lastEditFile: null, lastAgent: null },
    theme,
    preset,
    config: userConfig,
    i18n: loadI18n(userConfig.lang),
    model: 'Opus 4.7',
    dir: '~/project',
    contextPct: 45,
    usagePct: 60,
    costUsd: 0.42,
    duration: '15m',
    effort: 'medium',
  };
}
```

### 5. Debouncing/Throttling Strategies

#### Pattern A: Debounce (wait for user to stop typing)

```typescript
interface DebounceState {
  timeoutId: NodeJS.Timeout | null;
  delay: number;
}

function debounce(fn: () => void, state: DebounceState): void {
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
  }
  
  state.timeoutId = setTimeout(() => {
    fn();
    state.timeoutId = null;
  }, state.delay);
}

// Usage in config change handler
const previewDebounce: DebounceState = { timeoutId: null, delay: 150 };

function onConfigChange(newConfig: Config): void {
  debounce(() => {
    renderPreview(createPreviewContext(newConfig, theme, preset));
  }, previewDebounce);
}
```

**Recommended delay**: 100-200ms for typing, 50-100ms for arrow key navigation

#### Pattern B: Throttle (limit update frequency)

```typescript
interface ThrottleState {
  lastCallTime: number;
  interval: number;
  pendingCall: (() => void) | null;
}

function throttle(fn: () => void, state: ThrottleState): void {
  const now = Date.now();
  const timeSinceLastCall = now - state.lastCallTime;
  
  if (timeSinceLastCall >= state.interval) {
    fn();
    state.lastCallTime = now;
    state.pendingCall = null;
  } else {
    // Schedule pending call
    state.pendingCall = fn;
    setTimeout(() => {
      if (state.pendingCall) {
        state.pendingCall();
        state.lastCallTime = Date.now();
        state.pendingCall = null;
      }
    }, state.interval - timeSinceLastCall);
  }
}
```

**Recommended interval**: 16ms (60fps) for smooth updates, 33ms (30fps) for acceptable performance

#### Pattern C: Hybrid (debounce + throttle)

```typescript
// Throttle during rapid changes, debounce for final update
function hybridUpdate(fn: () => void, throttleState: ThrottleState, debounceState: DebounceState): void {
  throttle(fn, throttleState);  // Immediate feedback
  debounce(fn, debounceState);  // Final accurate render
}
```

### 6. Common Pitfalls and Performance Considerations

#### Pitfall 1: ANSI code accumulation

**Problem**: Repeatedly applying color codes without reset causes visual artifacts

**Solution**: Always reset before applying new styles
```typescript
function safeColorize(text: string, color: string): string {
  return `${ANSI.reset}${color}${text}${ANSI.reset}`;
}
```

#### Pitfall 2: Terminal state corruption on crash

**Problem**: If preview mode crashes, terminal left in bad state (hidden cursor, alt screen)

**Solution**: Install cleanup handlers
```typescript
function installCleanupHandlers(): void {
  const cleanup = () => {
    process.stdout.write(CURSOR.show);
    process.stdout.write(ALT_SCREEN.exit);
  };
  
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });
  process.on('uncaughtException', (err) => {
    cleanup();
    console.error('Uncaught exception:', err);
    process.exit(1);
  });
}
```

#### Pitfall 3: Blocking I/O during preview updates

**Problem**: Synchronous file reads (like `readFileSync`) block rendering loop

**Solution**: Pre-load all config/theme/preset data before entering preview mode
```typescript
async function enterConfigureWithPreview(): Promise<void> {
  // Pre-load all data
  const allThemes = await Promise.all(THEMES.map(name => loadTheme(name)));
  const allPresets = await Promise.all(PRESETS.map(name => loadPreset(name)));
  
  // Now enter interactive mode with pre-loaded data
  startInteractivePreview(allThemes, allPresets);
}
```

#### Pitfall 4: Memory leaks from event listeners

**Problem**: Adding resize listeners without cleanup

**Solution**: Track and remove listeners
```typescript
interface PreviewSession {
  resizeHandler: () => void;
  active: boolean;
}

function startPreview(session: PreviewSession): void {
  session.resizeHandler = () => {
    if (session.active) {
      renderPreview();
    }
  };
  process.stdout.on('resize', session.resizeHandler);
}

function stopPreview(session: PreviewSession): void {
  session.active = false;
  process.stdout.off('resize', session.resizeHandler);
}
```

#### Pitfall 5: Incorrect line counting with ANSI codes

**Problem**: Counting ANSI escape sequences as visible characters

**Solution**: Strip ANSI codes before measuring
```typescript
function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function getVisibleLength(text: string): number {
  return stripAnsi(text).length;
}

function countVisibleLines(text: string, terminalWidth: number): number {
  const lines = text.split('\n');
  let totalLines = 0;
  
  for (const line of lines) {
    const visibleLength = getVisibleLength(line);
    totalLines += Math.ceil(visibleLength / terminalWidth) || 1;
  }
  
  return totalLines;
}
```

#### Performance Consideration 1: Minimize stdout writes

**Problem**: Each `process.stdout.write()` call has overhead

**Solution**: Batch writes into single call
```typescript
// Bad: Multiple writes
process.stdout.write(CURSOR.up(5));
process.stdout.write(SCREEN.clearLine);
process.stdout.write('New content\n');

// Good: Single write
process.stdout.write(CURSOR.up(5) + SCREEN.clearLine + 'New content\n');
```

#### Performance Consideration 2: Avoid unnecessary re-renders

**Problem**: Re-rendering on every keystroke even when preview doesn't change

**Solution**: Compare config hash before rendering
```typescript
function configHash(config: Config): string {
  return JSON.stringify({ theme: config.theme, preset: config.preset, lang: config.lang });
}

let lastConfigHash = '';

function updatePreviewIfChanged(config: Config): void {
  const currentHash = configHash(config);
  if (currentHash !== lastConfigHash) {
    renderPreview(config);
    lastConfigHash = currentHash;
  }
}
```

## Examples from Similar Tools

### 1. fzf (fuzzy finder)

**Pattern**: Alternate screen buffer + real-time filtering
- Uses `\x1b[?1049h` to enter alt screen
- Updates preview pane on every keystroke (throttled to 60fps)
- Handles terminal resize by recalculating layout
- Cleans up on Ctrl+C with signal handlers

### 2. lazygit (git TUI)

**Pattern**: Panel-based layout with selective updates
- Divides screen into regions (file list, diff preview, status)
- Only re-renders changed panels
- Uses double-buffering to reduce flicker
- Debounces file system watches (200ms)

### 3. k9s (Kubernetes TUI)

**Pattern**: Full-screen TUI with live data
- Uses `tcell` library (Go) for terminal abstraction
- Throttles API calls (1-5 second intervals)
- Caches previous render to compute diffs
- Graceful degradation on small terminals (hides less important panels)

### 4. npm/yarn interactive upgrade

**Pattern**: In-place preview with cursor manipulation
- Shows preview of package.json changes
- Uses cursor up/down to overwrite previous output
- Debounces selection changes (100ms)
- Falls back to non-interactive mode if terminal doesn't support ANSI

## Recommendations for cc-fusion TUI

### Minimal Implementation (Phase 1)

1. **Add cursor control codes** to `src/utils.ts`
2. **Implement overwrite-in-place rendering** (Strategy A)
3. **Use debouncing** (150ms delay) for config changes
4. **Pre-load all themes/presets** before entering interactive mode
5. **Install cleanup handlers** for cursor show/hide

### Enhanced Implementation (Phase 2)

1. **Add terminal resize handling** with re-render
2. **Implement viewport scrolling** for long previews
3. **Add double-buffering** to reduce flicker
4. **Optimize with config hash comparison**

### Advanced Implementation (Phase 3)

1. **Use alternate screen buffer** for full TUI experience
2. **Add keyboard navigation** (arrow keys, vim keys)
3. **Implement split-pane layout** (config on left, preview on right)
4. **Add animation/transitions** for theme changes

## Caveats / Not Found

- **No TUI library in current dependencies**: cc-fusion uses only native Node.js APIs. Adding a library like `blessed`, `ink`, or `terminal-kit` would simplify implementation but increase bundle size.
- **No existing preview infrastructure**: Current architecture is one-shot execution. Adding preview requires significant refactoring of `src/configure.ts`.
- **Terminal compatibility**: ANSI escape sequences work in most modern terminals, but some (Windows cmd.exe without ANSI support) may not render correctly. Consider detecting terminal capabilities with `process.env.TERM`.
- **Testing challenges**: TUI interactions are hard to test automatically. Consider adding a `--dry-run` mode that outputs preview frames to files for visual regression testing.

## References

- ANSI escape codes: https://en.wikipedia.org/wiki/ANSI_escape_code
- Node.js TTY documentation: https://nodejs.org/api/tty.html
- Terminal control sequences: https://invisible-island.net/xterm/ctlseqs/ctlseqs.html
