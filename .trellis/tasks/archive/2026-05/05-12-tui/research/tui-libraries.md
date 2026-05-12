# Research: TUI Libraries for Node.js/TypeScript

- **Query**: Research TUI libraries for interactive configuration interface with multi-panel layout, keyboard navigation, and real-time preview
- **Scope**: External (library comparison)
- **Date**: 2026-05-12

## Project Constraints

- **Node.js**: >=18
- **Language**: TypeScript codebase
- **Dependencies**: Zero current runtime dependencies (only @types/node, typescript in devDependencies)
- **Use Case**: Interactive configuration interface with multi-panel layout, keyboard navigation, real-time preview

## Libraries Evaluated

### 1. Ink (React-based TUI)

**Repository**: https://github.com/vadimdemedes/ink  
**npm**: `ink` (v4.x as of Jan 2025)  
**Maintainer**: Vercel (vadimdemedes)

#### Strengths
- **TypeScript Support**: Excellent - First-class TypeScript support with full type definitions
- **Multi-Panel Layouts**: Strong - Uses React Flexbox model (`<Box>` component with flex properties)
- **Keyboard Handling**: Good - `useInput()` hook for keyboard events, supports focus management
- **ANSI/Unicode/Emoji**: Excellent - Full support via `chalk` integration and React rendering
- **Active Maintenance**: Very active - Regular updates, large community, backed by Vercel
- **Developer Experience**: Excellent - React paradigm familiar to many developers, hot reload support
- **Testing**: Good - `ink-testing-library` available for component testing

#### Weaknesses
- **Dependencies**: Heavy - Requires React (react, react-reconciler), yoga-wasm-web for layout
- **Bundle Size**: Larger footprint due to React runtime
- **Learning Curve**: Requires React knowledge
- **Performance**: Slightly slower for simple UIs due to reconciliation overhead

#### Dependency Count
- Direct: ~10-15 packages (react, react-reconciler, yoga-wasm-web, chalk, cli-cursor, etc.)
- Transitive: ~30-50 packages

#### Code Example
```typescript
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

const ConfigUI = () => {
  const [selected, setSelected] = useState(0);
  
  useInput((input, key) => {
    if (key.upArrow) setSelected(s => Math.max(0, s - 1));
    if (key.downArrow) setSelected(s => s + 1);
  });
  
  return (
    <Box flexDirection="column">
      <Box borderStyle="round" padding={1}>
        <Text>Configuration Panel</Text>
      </Box>
      <Box flexDirection="row">
        <Box width="50%" borderStyle="single">
          <Text>Options</Text>
        </Box>
        <Box width="50%" borderStyle="single">
          <Text>Preview</Text>
        </Box>
      </Box>
    </Box>
  );
};

render(<ConfigUI />);
```

#### Verdict for cc-fusion
- **Fit**: Medium - Excellent DX and TypeScript support, but heavy dependencies conflict with "zero runtime dependencies" goal
- **Breaking Change**: Yes - Would add 30-50 transitive dependencies

---

### 2. blessed

**Repository**: https://github.com/chjj/blessed  
**npm**: `blessed` (v0.1.81 as of Jan 2025)  
**Maintainer**: chjj (original), community-maintained

#### Strengths
- **TypeScript Support**: Fair - Community types available via `@types/blessed`, but not first-class
- **Multi-Panel Layouts**: Excellent - Rich widget system (Box, List, Form, Table, etc.), absolute/relative positioning
- **Keyboard Handling**: Excellent - Comprehensive key event system, focus management, mouse support
- **ANSI/Unicode/Emoji**: Good - Supports ANSI colors, Unicode, but emoji rendering depends on terminal
- **Widget Library**: Extensive - Built-in widgets for lists, forms, tables, progress bars, etc.
- **Maturity**: Very mature - Battle-tested, used in many production CLIs

#### Weaknesses
- **Active Maintenance**: Low - Original maintainer inactive, community forks exist (neo-blessed, blessed-contrib)
- **TypeScript Experience**: Poor - Types are incomplete, many `any` types, not idiomatic TypeScript
- **API Design**: Dated - Callback-heavy, imperative API, not modern async/await patterns
- **Documentation**: Scattered - Main docs outdated, community knowledge in issues/forks
- **Dependencies**: Minimal - Only a few direct dependencies

#### Dependency Count
- Direct: ~3-5 packages
- Transitive: ~10-15 packages

#### Code Example
```typescript
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'Configuration'
});

const leftPanel = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '50%',
  height: '100%',
  border: { type: 'line' },
  label: 'Options'
});

const rightPanel = blessed.box({
  parent: screen,
  top: 0,
  left: '50%',
  width: '50%',
  height: '100%',
  border: { type: 'line' },
  label: 'Preview'
});

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
screen.render();
```

#### Verdict for cc-fusion
- **Fit**: Medium-Low - Minimal dependencies (good), but poor TypeScript experience and maintenance concerns
- **Breaking Change**: Yes - Would add 10-15 dependencies
- **Risk**: Maintenance uncertainty, potential need to fork or migrate later

---

### 3. neo-blessed

**Repository**: https://github.com/embark-framework/neo-blessed  
**npm**: `neo-blessed` (fork of blessed, more active)  
**Maintainer**: Embark Framework community

#### Strengths
- **TypeScript Support**: Fair-Good - Better than blessed, includes some TypeScript improvements
- **Multi-Panel Layouts**: Excellent - Inherits blessed's widget system
- **Keyboard Handling**: Excellent - Same as blessed
- **ANSI/Unicode/Emoji**: Good - Same as blessed
- **Active Maintenance**: Medium - More active than blessed, but still community-driven
- **Compatibility**: Drop-in replacement for blessed

#### Weaknesses
- **TypeScript Experience**: Fair - Better than blessed but still not first-class
- **Community Size**: Smaller than blessed or ink
- **Long-term Viability**: Uncertain - Depends on Embark Framework community

#### Dependency Count
- Direct: ~3-5 packages (similar to blessed)
- Transitive: ~10-15 packages

#### Verdict for cc-fusion
- **Fit**: Medium - Better maintenance than blessed, but TypeScript experience still subpar
- **Breaking Change**: Yes - Would add 10-15 dependencies

---

### 4. terminal-kit

**Repository**: https://github.com/cronvel/terminal-kit  
**npm**: `terminal-kit` (v3.x as of Jan 2025)  
**Maintainer**: cronvel (active)

#### Strengths
- **TypeScript Support**: Fair - Community types via `@types/terminal-kit`, improving
- **Multi-Panel Layouts**: Good - Document model with layout support, not as rich as blessed
- **Keyboard Handling**: Excellent - Comprehensive input handling, including mouse
- **ANSI/Unicode/Emoji**: Excellent - Strong color/style support, image rendering capabilities
- **Active Maintenance**: Good - Regular updates from maintainer
- **Features**: Rich - Includes progress bars, menus, forms, image rendering
- **Performance**: Good - Efficient rendering

#### Weaknesses
- **TypeScript Experience**: Fair - Types exist but not first-class
- **Learning Curve**: Steeper - Different API paradigm from blessed/ink
- **Documentation**: Good but dense
- **Dependencies**: Moderate

#### Dependency Count
- Direct: ~8-12 packages
- Transitive: ~20-30 packages

#### Code Example
```typescript
import terminalKit from 'terminal-kit';
const term = terminalKit.terminal;

const document = term.createDocument();

const leftPanel = new terminalKit.ColumnMenu({
  parent: document,
  x: 0,
  y: 0,
  width: term.width / 2,
  items: ['Option 1', 'Option 2', 'Option 3']
});

const rightPanel = new terminalKit.TextBox({
  parent: document,
  x: term.width / 2,
  y: 0,
  width: term.width / 2,
  content: 'Preview area'
});

document.draw();
```

#### Verdict for cc-fusion
- **Fit**: Medium - Good maintenance and features, but moderate dependencies
- **Breaking Change**: Yes - Would add 20-30 dependencies

---

### 5. Custom Low-Level Approach (ANSI Escape Codes)

**Libraries**: `ansi-escapes`, `cli-cursor`, `chalk`, `strip-ansi`  
**Approach**: Build custom TUI using low-level terminal control

#### Strengths
- **TypeScript Support**: Excellent - All libraries have first-class TypeScript support
- **Dependencies**: Minimal - Only 4-6 small, focused packages
- **Control**: Complete - Full control over rendering and behavior
- **Bundle Size**: Smallest - Each library is tiny (few KB)
- **Maintenance**: Good - All libraries actively maintained
- **Flexibility**: Maximum - No framework constraints

#### Weaknesses
- **Development Time**: High - Must build layout, keyboard handling, state management from scratch
- **Complexity**: High - Manual cursor positioning, screen buffering, input parsing
- **Testing**: Harder - No built-in testing utilities
- **Multi-Panel Layout**: Must implement manually - No built-in layout engine
- **Bugs**: Higher risk - More surface area for terminal compatibility issues

#### Dependency Count
- Direct: ~4-6 packages
- Transitive: ~8-12 packages

#### Code Example
```typescript
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';

class ConfigUI {
  private selectedIndex = 0;
  
  render() {
    const output = [
      ansiEscapes.clearScreen,
      ansiEscapes.cursorTo(0, 0),
      chalk.bold('Configuration'),
      '\n',
      this.renderLeftPanel(),
      this.renderRightPanel()
    ].join('');
    
    process.stdout.write(output);
  }
  
  renderLeftPanel(): string {
    // Manual layout calculation and rendering
    return '...';
  }
  
  handleInput(key: string) {
    // Manual keyboard handling
  }
}
```

#### Verdict for cc-fusion
- **Fit**: Medium-High - Minimal dependencies (excellent), but high development cost
- **Breaking Change**: Yes - Would add 8-12 dependencies, but smallest footprint
- **Risk**: Development time and complexity

---

## Comparison Matrix

| Library | TypeScript | Multi-Panel | Keyboard | Maintenance | Dependencies | Bundle Size | DX |
|---------|-----------|-------------|----------|-------------|--------------|-------------|-----|
| **ink** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ Heavy (30-50) | ❌ Large | ⭐⭐⭐⭐⭐ |
| **blessed** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ✅ Light (10-15) | ✅ Small | ⭐⭐ |
| **neo-blessed** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Light (10-15) | ✅ Small | ⭐⭐⭐ |
| **terminal-kit** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Medium (20-30) | ⚠️ Medium | ⭐⭐⭐ |
| **Custom/Low-level** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Minimal (8-12) | ✅ Tiny | ⭐⭐ |

---

## Recommendations

### Option 1: neo-blessed (Recommended for Balance)

**Why**: Best balance of features, dependencies, and maintenance

**Pros**:
- Rich widget system out-of-the-box (lists, forms, boxes, borders)
- Excellent keyboard/mouse handling
- Relatively light dependencies (~10-15 packages)
- More active than blessed, better TypeScript support
- Battle-tested architecture

**Cons**:
- TypeScript experience not ideal (but workable)
- Imperative API (not modern React-style)
- Breaks "zero dependencies" principle

**Trade-offs**:
- Accept 10-15 dependencies for mature, feature-rich TUI framework
- Accept imperative API for faster development vs custom solution
- Accept fair TypeScript support for proven stability

**Migration Path**: If maintenance becomes an issue, can fork or migrate to custom solution later

---

### Option 2: Custom Low-Level (Recommended for Minimal Dependencies)

**Why**: Maintains minimal dependency footprint, full control

**Pros**:
- Smallest dependency footprint (8-12 packages, all tiny)
- First-class TypeScript support
- Complete control over behavior
- No framework lock-in
- All dependencies actively maintained

**Cons**:
- High development time (2-3x vs framework)
- Must implement layout engine, focus management, input handling
- Higher bug surface area
- More testing burden

**Trade-offs**:
- Accept higher development cost for minimal dependencies
- Accept more manual work for full control
- Accept longer timeline for cleaner architecture

**Recommended Stack**:
- `ansi-escapes` - Terminal control sequences
- `chalk` - Color/styling
- `cli-cursor` - Cursor visibility
- `strip-ansi` - String width calculation
- `readline` (Node.js built-in) - Input handling

---

### Option 3: ink (NOT Recommended for cc-fusion)

**Why**: Excellent DX but conflicts with project constraints

**Pros**:
- Best TypeScript experience
- Best developer experience (React paradigm)
- Best testing story
- Most active maintenance

**Cons**:
- Heavy dependencies (30-50 packages) - **Deal breaker**
- Larger bundle size
- Requires React knowledge
- Overkill for configuration UI

**Trade-offs**: Would require accepting significant dependency bloat for DX benefits

**Verdict**: Only consider if project is willing to abandon "minimal dependencies" principle

---

## Decision Framework

### If Priority is: Minimal Dependencies
→ **Custom Low-Level** (8-12 deps) or **neo-blessed** (10-15 deps)

### If Priority is: Fast Development
→ **neo-blessed** (rich widgets) or **ink** (React DX, but heavy)

### If Priority is: TypeScript Experience
→ **Custom Low-Level** (first-class) or **ink** (first-class, but heavy)

### If Priority is: Long-term Maintenance
→ **Custom Low-Level** (full control) or **ink** (Vercel-backed)

---

## Recommended Path for cc-fusion

Given constraints (Node.js >=18, TypeScript, zero current dependencies) and requirements (multi-panel, keyboard nav, preview):

### Phase 1: Start with neo-blessed
- Accept 10-15 dependencies as pragmatic trade-off
- Leverage mature widget system for faster MVP
- Get working prototype quickly

### Phase 2: Evaluate Custom Migration
- After MVP proves value, assess if custom solution worth investment
- Could incrementally replace neo-blessed components
- Maintain compatibility layer during transition

### Alternative: Start Custom if Timeline Allows
- If 2-3x development time acceptable
- Build minimal, focused TUI layer
- Maintain smallest possible footprint from start

---

## Implementation Notes

### For neo-blessed Approach
```bash
npm install neo-blessed
npm install --save-dev @types/blessed
```

Key components needed:
- `blessed.screen()` - Main screen manager
- `blessed.box()` - Panel containers
- `blessed.list()` - Option lists with keyboard nav
- `blessed.text()` - Preview rendering
- Focus management for keyboard navigation

### For Custom Approach
```bash
npm install ansi-escapes chalk cli-cursor strip-ansi
```

Key components to build:
- Screen buffer manager
- Layout engine (column/row calculations)
- Keyboard input handler (readline integration)
- Focus/selection state manager
- Render loop with dirty checking

---

## Caveats

1. **Emoji Support**: All solutions depend on terminal capabilities; test across iTerm2, Terminal.app, Windows Terminal
2. **Windows Compatibility**: blessed/neo-blessed have known Windows issues; custom solution may need platform-specific handling
3. **Terminal Size Changes**: All solutions need SIGWINCH handling for responsive layout
4. **Testing**: TUI testing is inherently harder; consider snapshot testing of ANSI output
5. **Accessibility**: TUI interfaces have limited screen reader support; document keyboard shortcuts clearly

---

## External References

- blessed: https://github.com/chjj/blessed
- neo-blessed: https://github.com/embark-framework/neo-blessed
- ink: https://github.com/vadimdemedes/ink
- terminal-kit: https://github.com/cronvel/terminal-kit
- ansi-escapes: https://github.com/sindresorhus/ansi-escapes
- chalk: https://github.com/chalk/chalk

---

## Next Steps for Implementation Agent

1. **Decision Required**: Choose between neo-blessed (fast) vs custom (minimal)
2. **Prototype Scope**: Define minimal viable configuration UI (which panels, which options)
3. **Integration Point**: Determine how TUI integrates with existing `src/configure.ts`
4. **Fallback Strategy**: Keep current prompt-based flow as fallback for non-TTY environments
