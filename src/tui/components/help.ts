/**
 * help.ts — Help panel component
 */

import type { Rect } from '../layout.js';
import { ANSI, colorize } from '../../utils.js';

export class HelpPanel {
  render(rect: Rect, focusedPanel: string): string[] {
    const output: string[] = [];

    const shortcuts = this.getShortcuts(focusedPanel);
    const line = shortcuts.join('  ');

    const padded = this.padLine(line, rect.width);
    output.push(`${ANSI.dim}${padded}${ANSI.reset}`);

    return output;
  }

  private getShortcuts(focusedPanel: string): string[] {
    const common = [
      colorize('Tab', ANSI.cyan) + ':switch',
      colorize('↑↓', ANSI.cyan) + ':navigate',
      colorize('Enter', ANSI.cyan) + ':select',
      colorize('S', ANSI.cyan) + ':save',
      colorize('Q/Esc', ANSI.cyan) + ':quit',
    ];

    if (focusedPanel === 'theme') {
      return [colorize('1-6', ANSI.cyan) + ':quick switch', ...common];
    }

    return common;
  }

  private padLine(line: string, width: number): string {
    const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
    const visible = stripAnsi(line);
    const padding = Math.max(0, width - visible.length);
    return line + ' '.repeat(padding);
  }
}
