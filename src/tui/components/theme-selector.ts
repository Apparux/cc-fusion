/**
 * theme-selector.ts — Theme selector panel component
 */

import type { Rect } from '../layout.js';
import { ANSI, colorize } from '../../utils.js';

const THEMES = [
  { name: 'cometix', desc: 'CCometixLine-inspired Nerd Font style' },
  { name: 'hud', desc: 'muted Claude HUD style' },
  { name: 'neon', desc: 'purple HUD style with bracketed mint bars' },
  { name: 'gruvbox', desc: 'warm retro palette' },
  { name: 'dracula', desc: 'modern dark purple palette' },
  { name: 'nord', desc: 'cold Nordic blue-gray palette' },
];

export class ThemeSelectorPanel {
  private selectedIndex = 0;

  render(rect: Rect, currentTheme: string, focused: boolean): string[] {
    const output: string[] = [];
    const border = this.renderBorder(rect.width, 'Themes (1-6 to quick switch)');
    output.push(border);

    const themeIndex = THEMES.findIndex(t => t.name === currentTheme);
    if (themeIndex !== -1) {
      this.selectedIndex = themeIndex;
    }

    const themeLine = THEMES.map((theme, i) => {
      const isCurrent = theme.name === currentTheme;
      const isSelected = i === this.selectedIndex && focused;

      let display = `${i + 1}.${theme.name}`;

      if (isCurrent) {
        display = colorize(display, ANSI.green);
      } else if (isSelected) {
        display = colorize(display, ANSI.cyan);
      }

      return display;
    }).join('  ');

    output.push(`${ANSI.dim}│${ANSI.reset} ${themeLine} ${ANSI.dim}│${ANSI.reset}`);
    output.push(this.renderBorder(rect.width, ''));

    return output;
  }

  moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + THEMES.length) % THEMES.length;
  }

  getSelectedTheme(): string {
    return THEMES[this.selectedIndex].name;
  }

  selectThemeByNumber(num: number): string | null {
    if (num >= 1 && num <= THEMES.length) {
      this.selectedIndex = num - 1;
      return THEMES[this.selectedIndex].name;
    }
    return null;
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
}
