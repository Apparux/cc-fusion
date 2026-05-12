/**
 * preset-selector.ts — Preset selector panel component
 */

import type { Rect } from '../layout.js';
import { ANSI, colorize } from '../../utils.js';

const PRESETS = [
  { name: 'full', desc: 'full multi-line layout with all elements' },
  { name: 'essential', desc: '2 lines with model, git, context, usage, and cost' },
  { name: 'minimal', desc: '1 line with model and context only' },
];

export class PresetSelectorPanel {
  private selectedIndex = 0;

  render(rect: Rect, currentPreset: string, focused: boolean): string[] {
    const output: string[] = [];
    const border = this.renderBorder(rect.width, 'Presets');
    output.push(border);

    const presetIndex = PRESETS.findIndex(p => p.name === currentPreset);
    if (presetIndex !== -1) {
      this.selectedIndex = presetIndex;
    }

    for (let i = 0; i < PRESETS.length; i++) {
      const preset = PRESETS[i];
      const isCurrent = preset.name === currentPreset;
      const isSelected = i === this.selectedIndex && focused;

      let display = `${preset.name}`;

      if (isCurrent && isSelected) {
        display = colorize(`▶ ${display}`, ANSI.cyan);
      } else if (isCurrent) {
        display = colorize(`● ${display}`, ANSI.green);
      } else if (isSelected) {
        display = colorize(`  ${display}`, ANSI.cyan);
      } else {
        display = `  ${display}`;
      }

      const line = this.padLine(`${display}`, rect.width - 4);
      output.push(`${ANSI.dim}│${ANSI.reset} ${line} ${ANSI.dim}│${ANSI.reset}`);

      const descLine = this.padLine(`  ${ANSI.dim}${preset.desc}${ANSI.reset}`, rect.width - 4);
      output.push(`${ANSI.dim}│${ANSI.reset} ${descLine} ${ANSI.dim}│${ANSI.reset}`);
    }

    while (output.length < rect.height - 1) {
      const emptyLine = this.padLine('', rect.width - 4);
      output.push(`${ANSI.dim}│${ANSI.reset} ${emptyLine} ${ANSI.dim}│${ANSI.reset}`);
    }

    output.push(this.renderBorder(rect.width, ''));

    return output;
  }

  moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + PRESETS.length) % PRESETS.length;
  }

  getSelectedPreset(): string {
    return PRESETS[this.selectedIndex].name;
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
