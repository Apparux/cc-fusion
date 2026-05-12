# Research: CCometixLine TUI Implementation

- **Query**: Research CCometixLine implementation approach and architecture for TUI patterns applicable to cc-fusion
- **Scope**: External (GitHub repository analysis)
- **Date**: 2026-05-12
- **Repository**: https://github.com/Haleclipse/CCometixLine (Rust, v1.1.2)

## Findings

### TUI Framework Stack

**Core Dependencies** (from `Cargo.toml`):
- **ratatui 0.30** - Main TUI framework
- **crossterm 0.29** - Terminal manipulation (raw mode, events, alternate screen)
- **ansi-to-tui 8.0** - Converts ANSI escape sequences to ratatui styled spans
- **ansi_term 0.12** - ANSI color/style generation

**Architecture Pattern**: Component-based rendering with centralized event loop.

### Multi-Panel Layout Structure

**Main Layout** (`src/ui/layout.rs`, `src/ui/app.rs:352-386`):

```rust
Layout::default()
    .direction(Direction::Vertical)
    .constraints([
        Constraint::Length(3),                     // Title
        Constraint::Length(preview_height),        // Preview (dynamic 3-8)
        Constraint::Length(theme_selector_height), // Theme selector (dynamic)
        Constraint::Min(10),                       // Main content
        Constraint::Length(help_height),           // Help (dynamic 3-8)
    ])
```

**Content Split** (`src/ui/layout.rs:24-33`):
```rust
Layout::default()
    .direction(Direction::Horizontal)
    .constraints([
        Constraint::Percentage(30), // Segment list
        Constraint::Percentage(70), // Settings panel
    ])
```

**Dynamic Height Calculation**:
- Preview: `calculate_height()` based on line count (min 3, max 8)
- Theme selector: Calculates based on terminal width and theme name wrapping
- Help: Adjusts based on status message presence and help item wrapping

### Real-Time Preview Updates

**Preview Component** (`src/ui/components/preview.rs`):

1. **Update Trigger**: Called whenever config changes (segment toggle, color change, reorder)
2. **Generation Flow**:
   ```rust
   update_preview_with_width(config, width) {
       // Generate mock segment data
       segments_data = generate_mock_segments_data(config)
       
       // Generate statusline with TUI-optimized wrapping
       preview_result = renderer.generate_for_tui_preview(segments_data, content_width)
       
       // Convert to owned Text with styled spans
       preview_text = convert_to_owned_lines(preview_result)
   }
   ```

3. **Mock Data Strategy** (`src/ui/components/preview.rs:84-192`):
   - Generates perfect preview data without environment dependencies
   - Each segment has hardcoded realistic values (e.g., "Sonnet 4", "master ✓", "78.2%")
   - Ensures preview always renders correctly regardless of actual system state

4. **ANSI to TUI Conversion** (`src/core/statusline.rs:70-88`):
   ```rust
   pub fn generate_for_tui() -> ratatui::text::Line {
       let full_output = self.generate(segments); // ANSI string
       full_output.into_text() // ansi-to-tui conversion
   }
   ```

5. **Smart Segment Wrapping** (`src/core/statusline.rs:91-150`):
   - Calculates visible width (strips ANSI sequences)
   - Wraps by segment boundaries, not mid-segment
   - Preserves separator styling across lines

### Emoji/Unicode Icon Rendering

**Icon Storage**:
- Stored as plain UTF-8 strings in segment config
- Two modes: `icon.plain` and `icon.nerd_font`
- Example: `"\u{e0b0}"` (Powerline arrow), `"██"` (color blocks)

**Rendering Approach**:
- Direct rendering via ratatui `Span::styled(icon, style)`
- No special emoji handling - relies on terminal font support
- Color picker uses `"██"` blocks with foreground color to show color preview

**Icon Selector Component** (`src/ui/components/icon_selector.rs`):
- Provides preset icon list
- Allows custom input for any Unicode character
- Tab to toggle between preset/custom modes

### Keyboard Navigation Patterns

**Main App Navigation** (`src/ui/app.rs:188-234`):

| Key | Action | Context |
|-----|--------|---------|
| `Esc` | Quit | Main app |
| `↑` / `↓` | Move selection | Current panel |
| `Shift+↑` / `Shift+↓` | Reorder segment | Segment list panel |
| `Tab` | Switch panel | Between segment list and settings |
| `Enter` | Toggle/Edit | Context-dependent |
| `1-4` | Quick theme switch | Main app |
| `P` | Cycle through themes | Main app |
| `R` | Reset to theme defaults | Main app |
| `E` | Open separator editor | Main app |
| `S` | Save config to config.toml | Main app |
| `W` | Write to current theme file | Main app |
| `Ctrl+S` | Save as new theme (name prompt) | Main app |

**Popup Navigation** (`src/ui/app.rs:106-185`):
- **Color Picker**: `↑↓←→` (grid navigation), `Tab` (cycle mode), `R` (RGB mode), `Enter` (select), `Esc` (cancel)
- **Icon Selector**: `↑↓` (list navigation), `Tab` (toggle style), `C` (custom input), `Enter` (select), `Esc` (cancel)
- **Separator Editor**: `↑↓` (preset selection), `Tab` (clear custom), `Char` (input), `Backspace`, `Enter` (confirm), `Esc` (cancel)
- **Name Input**: `Char` (input), `Backspace`, `Enter` (confirm), `Esc` (cancel)

**Event Handling Pattern** (`src/ui/app.rs:96-240`):
```rust
loop {
    terminal.draw(|f| app.ui(f))?;
    
    if let Event::Key(key) = event::read()? {
        if key.kind != KeyEventKind::Press { continue; } // Prevent double-trigger on Windows
        
        // Priority: popup events > main app events
        if popup.is_open {
            handle_popup_keys(key);
        } else {
            handle_main_keys(key);
        }
    }
}
```

### Configuration Save/Load Approach

**Config Structure**:
- **Main config**: `~/.claude/ccline/config.toml`
- **Theme files**: `~/.claude/ccline/themes/*.toml`
- **Models config**: `~/.claude/ccline/models.toml` (auto-created)

**Load Priority** (`src/config/loader.rs`):
1. Built-in defaults
2. Package `config.json`
3. Project `cc-fusion.config.json`
4. User `~/.claude/cc-fusion/config.json`
5. Environment variable `CC_FUSION_CONFIG`

**Save Operations**:
- **Save Config** (`S` key): Writes current state to `config.toml`
- **Write Theme** (`W` key): Overwrites current theme file with current config
- **Save as New Theme** (`Ctrl+S`): Prompts for name, creates new theme file

**Theme System** (`src/ui/themes/`):
- Built-in themes: `default`, `minimal`, `gruvbox`, `nord`, `powerline-*`
- Theme files are complete config snapshots
- `ThemePresets::get_theme(name)` loads theme
- `ThemePresets::save_theme(name, config)` persists theme

**Init Flow** (`src/config/loader.rs`):
```rust
Config::init() -> Result<InitResult> {
    // Creates ~/.claude/ccline/ directory
    // Writes default config.toml if not exists
    // Returns Created(path) or AlreadyExists(path)
}
```

### Component Architecture

**Component Count**: ~2443 total lines across 11 components

**Component Pattern**:
```rust
pub struct ComponentName {
    // State fields
    pub is_open: bool,
    selected_index: usize,
    // ...
}

impl ComponentName {
    pub fn new() -> Self { /* ... */ }
    pub fn open(&mut self) { /* ... */ }
    pub fn close(&mut self) { /* ... */ }
    pub fn render(&self, f: &mut Frame, area: Rect) { /* ... */ }
    // Event handlers
    pub fn move_selection(&mut self, delta: i32) { /* ... */ }
    pub fn input_char(&mut self, c: char) { /* ... */ }
}
```

**Component List** (`src/ui/components/`):
- `preview.rs` - Statusline preview with mock data
- `segment_list.rs` - Left panel segment list with enable/disable markers
- `settings.rs` - Right panel segment configuration
- `color_picker.rs` - Popup color picker (16/256/RGB modes)
- `icon_selector.rs` - Popup icon selector with presets
- `separator_editor.rs` - Popup separator editor
- `theme_selector.rs` - Theme switcher bar
- `help.rs` - Dynamic help text based on context
- `name_input.rs` - Popup text input for theme naming
- `editor.rs` - Generic text editor component
- `mod.rs` - Component exports

**Popup Pattern** (`src/ui/components/color_picker.rs:352-404`):
```rust
pub fn render(&mut self, f: &mut Frame, area: Rect) {
    if !self.is_open { return; }
    
    let popup_area = centered_rect(70, 75, area);
    f.render_widget(Clear, popup_area); // Clear background
    
    let popup_block = Block::default().borders(Borders::ALL).title("...");
    // Render popup content
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    // Calculate centered popup area
}
```

### Main Menu System

**Entry Point** (`src/ui/main_menu.rs`):
- Shown when executed without stdin input
- Menu items: Configuration Mode, Initialize Config, Check Config, About, Exit
- Returns `MenuResult` enum to dispatch to appropriate action
- Status messages shown in footer (success/error)
- About dialog as centered overlay popup

**Menu Flow**:
```
main.rs → MainMenu::run() → match result {
    LaunchConfigurator => App::run(),
    InitConfig => Config::init(),
    CheckConfig => Config::load()?.check(),
    Exit => exit
}
```

## Patterns Applicable to cc-fusion

### 1. Component-Based Architecture
- Self-contained components with `render()` method
- State managed within component structs
- Clear separation between layout and rendering logic

### 2. Dynamic Layout Calculation
- Calculate heights based on content and terminal width
- Use `Constraint::Length(dynamic_height)` for adaptive layouts
- Measure text wrapping before final layout

### 3. Preview Update Strategy
- Generate mock data for consistent preview
- Use ANSI-to-TUI conversion for styled text
- Cache preview text to avoid redundant generation
- Update preview on every config change

### 4. Keyboard Navigation
- Priority-based event handling (popup > main)
- Context-aware key bindings
- Modifier keys for advanced actions (Shift for reorder, Ctrl for save-as)
- Filter `KeyEventKind::Press` to prevent double-trigger on Windows

### 5. Configuration Persistence
- Separate config file from theme files
- Theme as complete config snapshot
- Multiple save operations (config vs theme)
- Init flow with directory creation

### 6. Popup Management
- Use `Clear` widget to overlay
- Centered rect helper function
- Modal event handling (popup blocks main app)
- Consistent Esc/Enter pattern

## Caveats / Limitations

1. **No Async Operations**: All operations are synchronous in the TUI loop
2. **No Undo/Redo**: Config changes are immediate, no history
3. **Limited Validation**: Config validation happens on save, not during editing
4. **Fixed Component Layout**: Layout percentages are hardcoded, not user-configurable
5. **Terminal Font Dependency**: Icon rendering quality depends on terminal font (Nerd Font required)
6. **No Mouse Support**: Keyboard-only navigation
7. **Single-Level Popup**: No nested popups (e.g., can't open color picker from separator editor)

## Code Quality Observations

**Strengths**:
- Clean component separation
- Consistent naming conventions
- Good use of Rust type system (enums for states)
- Comprehensive keyboard shortcuts
- Dynamic layout adaptation

**Areas for Improvement**:
- Some code duplication in color conversion (ANSI to ratatui Color)
- Large `app.rs` file (710 lines) could be split
- Limited error handling in TUI (most errors shown as status messages)
- No automated tests for TUI components

## References

- **Repository**: https://github.com/Haleclipse/CCometixLine
- **Version Analyzed**: v1.1.2 (commit: latest as of 2026-05-12)
- **Key Files**:
  - `src/ui/app.rs` - Main TUI application loop
  - `src/ui/layout.rs` - Layout utilities
  - `src/ui/components/preview.rs` - Preview component
  - `src/ui/components/color_picker.rs` - Color picker popup
  - `src/core/statusline.rs` - Statusline generation with ANSI/TUI conversion
  - `Cargo.toml` - Dependencies
