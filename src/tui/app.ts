/**
 * app.ts — Main TUI application
 */

import type { Config, Theme, Preset } from '../types.js';
import { loadConfig, loadTheme, loadPreset, getUserConfigPath, getUserConfigDir, mergeConfig } from '../config.js';
import { Screen } from './screen.js';
import { InputManager, type KeyPress } from './input.js';
import { Layout } from './layout.js';
import { PreviewPanel } from './components/preview.js';
import { ThemeSelectorPanel } from './components/theme-selector.js';
import { PresetSelectorPanel } from './components/preset-selector.js';
import { SettingsPanel } from './components/settings.js';
import { HelpPanel } from './components/help.js';
import { writeFileSync, mkdirSync } from 'fs';

type FocusedPanel = 'theme' | 'preset' | 'settings';

export class TUIApp {
  private screen: Screen;
  private input: InputManager;
  private layout: Layout;

  private previewPanel: PreviewPanel;
  private themeSelectorPanel: ThemeSelectorPanel;
  private presetSelectorPanel: PresetSelectorPanel;
  private settingsPanel: SettingsPanel;
  private helpPanel: HelpPanel;

  private config: Config;
  private theme: Theme;
  private preset: Preset;

  private focusedPanel: FocusedPanel = 'theme';
  private running = false;
  private needsRender = true;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.screen = new Screen();
    this.input = new InputManager();
    this.layout = new Layout();

    this.previewPanel = new PreviewPanel();
    this.themeSelectorPanel = new ThemeSelectorPanel();
    this.presetSelectorPanel = new PresetSelectorPanel();
    this.settingsPanel = new SettingsPanel();
    this.helpPanel = new HelpPanel();

    this.config = loadConfig();
    this.theme = loadTheme(this.config.theme);
    this.preset = loadPreset(this.config.preset);
  }

  async run(): Promise<void> {
    this.screen.enterAltScreen();
    this.screen.hideCursor();
    this.input.start();

    this.input.onKey(this.handleKey.bind(this));

    this.running = true;

    while (this.running) {
      if (this.needsRender) {
        this.render();
        this.needsRender = false;
      }

      await this.sleep(16);
    }

    this.cleanup();
  }

  private handleKey(key: KeyPress): void {
    if (key.name === 'q' || key.name === 'escape' || (key.ctrl && key.name === 'escape')) {
      this.running = false;
      return;
    }

    if (key.name === 's') {
      this.saveConfig();
      return;
    }

    if (key.name === 'tab') {
      this.switchPanel();
      this.needsRender = true;
      return;
    }

    if (/^[1-6]$/.test(key.name)) {
      const num = parseInt(key.name, 10);
      const newTheme = this.themeSelectorPanel.selectThemeByNumber(num);
      if (newTheme) {
        this.config = { ...this.config, theme: newTheme };
        this.theme = loadTheme(newTheme);
        this.scheduleRender();
      }
      return;
    }

    if (this.settingsPanel.isEditingNumber()) {
      if (key.name === 'enter') {
        this.config = this.settingsPanel.finishEditingNumber(this.config);
        this.scheduleRender();
      } else if (key.name === 'escape') {
        this.settingsPanel.cancelEditingNumber();
        this.needsRender = true;
      } else if (key.name === 'backspace') {
        this.settingsPanel.handleBackspace();
        this.needsRender = true;
      } else if (/^\d$/.test(key.name)) {
        this.settingsPanel.handleNumberInput(key.name);
        this.needsRender = true;
      }
      return;
    }

    if (key.name === 'up') {
      this.handleUp();
      this.needsRender = true;
    } else if (key.name === 'down') {
      this.handleDown();
      this.needsRender = true;
    } else if (key.name === 'enter') {
      this.handleEnter();
    }
  }

  private handleUp(): void {
    if (this.focusedPanel === 'theme') {
      this.themeSelectorPanel.moveSelection(-1);
    } else if (this.focusedPanel === 'preset') {
      this.presetSelectorPanel.moveSelection(-1);
    } else if (this.focusedPanel === 'settings') {
      if (this.settingsPanel.isOnElementsSetting()) {
        this.settingsPanel.moveElementSelection(-1);
      } else {
        this.settingsPanel.moveSelection(-1);
      }
    }
  }

  private handleDown(): void {
    if (this.focusedPanel === 'theme') {
      this.themeSelectorPanel.moveSelection(1);
    } else if (this.focusedPanel === 'preset') {
      this.presetSelectorPanel.moveSelection(1);
    } else if (this.focusedPanel === 'settings') {
      if (this.settingsPanel.isOnElementsSetting()) {
        this.settingsPanel.moveElementSelection(1);
      } else {
        this.settingsPanel.moveSelection(1);
      }
    }
  }

  private handleEnter(): void {
    if (this.focusedPanel === 'theme') {
      const newTheme = this.themeSelectorPanel.getSelectedTheme();
      this.config = { ...this.config, theme: newTheme };
      this.theme = loadTheme(newTheme);
      this.scheduleRender();
    } else if (this.focusedPanel === 'preset') {
      const newPreset = this.presetSelectorPanel.getSelectedPreset();
      this.config = { ...this.config, preset: newPreset };
      this.preset = loadPreset(newPreset);
      this.scheduleRender();
    } else if (this.focusedPanel === 'settings') {
      this.settingsPanel.startEditingNumber(this.config);
      if (!this.settingsPanel.isEditingNumber()) {
        this.config = this.settingsPanel.toggleCurrentSetting(this.config);
        this.scheduleRender();
      } else {
        this.needsRender = true;
      }
    }
  }

  private switchPanel(): void {
    const panels: FocusedPanel[] = ['theme', 'preset', 'settings'];
    const currentIndex = panels.indexOf(this.focusedPanel);
    const nextIndex = (currentIndex + 1) % panels.length;
    this.focusedPanel = panels[nextIndex];
  }

  private scheduleRender(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.needsRender = true;
      this.debounceTimer = null;
    }, 150);
  }

  private render(): void {
    const size = this.screen.getSize();
    const rects = this.layout.calculate(size.width, size.height);

    const lines: string[] = [];

    const previewLines = this.previewPanel.render(rects.preview, this.config, this.theme, this.preset);
    lines.push(...previewLines);

    const themeLines = this.themeSelectorPanel.render(rects.themeSelector, this.config.theme, this.focusedPanel === 'theme');
    lines.push(...themeLines);

    const maxContentHeight = Math.max(rects.presetSelector.height, rects.settings.height);

    const presetLines = this.presetSelectorPanel.render(
      { ...rects.presetSelector, height: maxContentHeight },
      this.config.preset,
      this.focusedPanel === 'preset'
    );

    const settingsLines = this.settingsPanel.render(
      { ...rects.settings, height: maxContentHeight },
      this.config,
      this.focusedPanel === 'settings'
    );

    for (let i = 0; i < maxContentHeight; i++) {
      const presetLine = presetLines[i] || this.padLine('', rects.presetSelector.width);
      const settingsLine = settingsLines[i] || this.padLine('', rects.settings.width);
      lines.push(presetLine + settingsLine);
    }

    const helpLines = this.helpPanel.render(rects.help, this.focusedPanel);
    lines.push(...helpLines);

    this.screen.render(lines);
  }

  private padLine(line: string, width: number): string {
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const visible = stripAnsi(line);
    const padding = Math.max(0, width - visible.length);
    return line + ' '.repeat(padding);
  }

  private saveConfig(): void {
    try {
      const configPath = getUserConfigPath();
      const configDir = getUserConfigDir();

      mkdirSync(configDir, { recursive: true });

      const configToSave = {
        theme: this.config.theme,
        preset: this.config.preset,
        lang: this.config.lang,
        showTranscript: this.config.showTranscript,
        barWidth: this.config.barWidth,
        usageThreshold: this.config.usageThreshold,
        tokenBreakdownThreshold: this.config.tokenBreakdownThreshold,
        elements: this.config.elements,
        hideCostFor: this.config.hideCostFor,
      };

      writeFileSync(configPath, JSON.stringify(configToSave, null, 2) + '\n');

      this.running = false;
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  private cleanup(): void {
    this.input.stop();
    this.screen.cleanup();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
