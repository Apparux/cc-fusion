/**
 * settings.ts — Settings panel component
 */

import type { Config } from '../../types.js';
import type { Rect } from '../layout.js';
import { ANSI, colorize } from '../../utils.js';

const ELEMENTS = ['usage', 'cost', 'duration', 'effort', 'tools', 'agents', 'todos'] as const;

interface SettingItem {
  key: string;
  label: string;
  type: 'boolean' | 'number' | 'select' | 'elements';
  options?: string[];
  min?: number;
  max?: number;
}

const SETTINGS: SettingItem[] = [
  { key: 'lang', label: 'Language', type: 'select', options: ['en', 'zh'] },
  { key: 'showTranscript', label: 'Show Transcript', type: 'boolean' },
  { key: 'barWidth', label: 'Bar Width', type: 'number', min: 5, max: 60 },
  { key: 'usageThreshold', label: 'Usage Threshold', type: 'number', min: 1, max: 100 },
  { key: 'tokenBreakdownThreshold', label: 'Token Breakdown Threshold', type: 'number', min: 1, max: 100 },
  { key: 'elements', label: 'Elements', type: 'elements' },
];

export class SettingsPanel {
  private selectedIndex = 0;
  private elementSelectedIndex = 0;
  private editingNumber = false;
  private numberBuffer = '';

  render(rect: Rect, config: Config, focused: boolean): string[] {
    const output: string[] = [];
    const border = this.renderBorder(rect.width, 'Settings');
    output.push(border);

    let lineIndex = 0;
    for (let i = 0; i < SETTINGS.length && lineIndex < rect.height - 2; i++) {
      const setting = SETTINGS[i];
      const isSelected = i === this.selectedIndex && focused;

      if (setting.type === 'elements') {
        const elementsLines = this.renderElements(config, isSelected, rect.width - 4);
        for (const line of elementsLines) {
          if (lineIndex >= rect.height - 2) break;
          output.push(`${ANSI.dim}│${ANSI.reset} ${line} ${ANSI.dim}│${ANSI.reset}`);
          lineIndex++;
        }
      } else {
        const line = this.renderSetting(setting, config, isSelected, rect.width - 4);
        output.push(`${ANSI.dim}│${ANSI.reset} ${line} ${ANSI.dim}│${ANSI.reset}`);
        lineIndex++;
      }
    }

    while (output.length < rect.height - 1) {
      const emptyLine = this.padLine('', rect.width - 4);
      output.push(`${ANSI.dim}│${ANSI.reset} ${emptyLine} ${ANSI.dim}│${ANSI.reset}`);
    }

    output.push(this.renderBorder(rect.width, ''));

    return output;
  }

  private renderSetting(setting: SettingItem, config: Config, isSelected: boolean, width: number): string {
    const value = (config as any)[setting.key];
    let valueStr = '';

    if (setting.type === 'boolean') {
      valueStr = value ? colorize('✓ true', ANSI.green) : colorize('✗ false', ANSI.red);
    } else if (setting.type === 'number') {
      if (this.editingNumber && isSelected) {
        valueStr = colorize(this.numberBuffer || String(value), ANSI.cyan);
      } else {
        valueStr = String(value);
      }
    } else if (setting.type === 'select') {
      valueStr = colorize(String(value), ANSI.cyan);
    }

    const prefix = isSelected ? colorize('▶', ANSI.cyan) : ' ';
    const label = isSelected ? colorize(setting.label, ANSI.cyan) : setting.label;
    const display = `${prefix} ${label}: ${valueStr}`;

    return this.padLine(display, width);
  }

  private renderElements(config: Config, isSelected: boolean, width: number): string[] {
    const lines: string[] = [];
    const prefix = isSelected ? colorize('▶', ANSI.cyan) : ' ';
    const label = isSelected ? colorize('Elements:', ANSI.cyan) : 'Elements:';
    lines.push(this.padLine(`${prefix} ${label}`, width));

    for (let i = 0; i < ELEMENTS.length; i++) {
      const element = ELEMENTS[i];
      const enabled = config.elements?.[element] !== false;
      const isElementSelected = isSelected && i === this.elementSelectedIndex;

      const checkbox = enabled ? colorize('☑', ANSI.green) : colorize('☐', ANSI.dim);
      const elementLabel = isElementSelected ? colorize(element, ANSI.cyan) : element;
      const display = `    ${checkbox} ${elementLabel}`;

      lines.push(this.padLine(display, width));
    }

    return lines;
  }

  moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + SETTINGS.length) % SETTINGS.length;
    this.elementSelectedIndex = 0;
    this.editingNumber = false;
    this.numberBuffer = '';
  }

  moveElementSelection(delta: number): void {
    if (SETTINGS[this.selectedIndex].type === 'elements') {
      this.elementSelectedIndex = (this.elementSelectedIndex + delta + ELEMENTS.length) % ELEMENTS.length;
    }
  }

  toggleCurrentSetting(config: Config): Config {
    const setting = SETTINGS[this.selectedIndex];

    if (setting.type === 'boolean') {
      return { ...config, [setting.key]: !(config as any)[setting.key] };
    } else if (setting.type === 'select' && setting.options) {
      const currentValue = (config as any)[setting.key];
      const currentIndex = setting.options.indexOf(currentValue);
      const nextIndex = (currentIndex + 1) % setting.options.length;
      return { ...config, [setting.key]: setting.options[nextIndex] };
    } else if (setting.type === 'elements') {
      const element = ELEMENTS[this.elementSelectedIndex];
      const currentValue = config.elements?.[element] !== false;
      return {
        ...config,
        elements: {
          ...(config.elements || {}),
          [element]: !currentValue,
        },
      };
    }

    return config;
  }

  startEditingNumber(config: Config): void {
    const setting = SETTINGS[this.selectedIndex];
    if (setting.type === 'number') {
      this.editingNumber = true;
      this.numberBuffer = String((config as any)[setting.key]);
    }
  }

  handleNumberInput(char: string): void {
    if (/^\d$/.test(char)) {
      this.numberBuffer += char;
    }
  }

  handleBackspace(): void {
    if (this.editingNumber && this.numberBuffer.length > 0) {
      this.numberBuffer = this.numberBuffer.slice(0, -1);
    }
  }

  finishEditingNumber(config: Config): Config {
    if (!this.editingNumber) return config;

    const setting = SETTINGS[this.selectedIndex];
    if (setting.type === 'number') {
      const value = parseInt(this.numberBuffer, 10);
      if (!isNaN(value) && value >= (setting.min || 0) && value <= (setting.max || 100)) {
        this.editingNumber = false;
        this.numberBuffer = '';
        return { ...config, [setting.key]: value };
      }
    }

    this.editingNumber = false;
    this.numberBuffer = '';
    return config;
  }

  cancelEditingNumber(): void {
    this.editingNumber = false;
    this.numberBuffer = '';
  }

  isEditingNumber(): boolean {
    return this.editingNumber;
  }

  isOnElementsSetting(): boolean {
    return SETTINGS[this.selectedIndex].type === 'elements';
  }

  private renderBorder(width: number, title: string): string {
    if (title) {
      const titlePart = ` ${title} `;
      const remaining = width - titlePart.length - 2;
      const left = Math.floor(remaining / 2);
      const right = remaining - left;
      return `${ANSI.dim}┌${'─'.repeat(left)}${ANSI.reset}${titlePart}${ANSI.dim}${'─'.repeat(right)}┐${ANSI.reset}`;
    }
    return `${ANSI.dim}└${'─'.repeat(width - 2)}┘${ANSI.reset}`;
  }

  private padLine(line: string, width: number): string {
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const visible = stripAnsi(line);
    const padding = Math.max(0, width - visible.length);
    return line + ' '.repeat(padding);
  }
}
