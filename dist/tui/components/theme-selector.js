"use strict";
/**
 * theme-selector.ts — Theme selector panel component
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSelectorPanel = void 0;
const utils_js_1 = require("../../utils.js");
const THEMES = [
    { name: 'cometix', desc: 'CCometixLine-inspired Nerd Font style' },
    { name: 'hud', desc: 'muted Claude HUD style' },
    { name: 'neon', desc: 'purple HUD style with bracketed mint bars' },
    { name: 'gruvbox', desc: 'warm retro palette' },
    { name: 'dracula', desc: 'modern dark purple palette' },
    { name: 'nord', desc: 'cold Nordic blue-gray palette' },
];
class ThemeSelectorPanel {
    constructor() {
        this.selectedIndex = 0;
    }
    render(rect, currentTheme, focused) {
        const output = [];
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
                display = (0, utils_js_1.colorize)(display, utils_js_1.ANSI.green);
            }
            else if (isSelected) {
                display = (0, utils_js_1.colorize)(display, utils_js_1.ANSI.cyan);
            }
            return display;
        }).join('  ');
        output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${themeLine} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
        output.push(this.renderBorder(rect.width, ''));
        return output;
    }
    moveSelection(delta) {
        this.selectedIndex = (this.selectedIndex + delta + THEMES.length) % THEMES.length;
    }
    getSelectedTheme() {
        return THEMES[this.selectedIndex].name;
    }
    selectThemeByNumber(num) {
        if (num >= 1 && num <= THEMES.length) {
            this.selectedIndex = num - 1;
            return THEMES[this.selectedIndex].name;
        }
        return null;
    }
    renderBorder(width, title) {
        if (title) {
            const titlePart = ` ${title} `;
            const remaining = width - titlePart.length - 2;
            const left = Math.floor(remaining / 2);
            const right = remaining - left;
            return `${utils_js_1.ANSI.dim}┌${'─'.repeat(left)}${utils_js_1.ANSI.reset}${titlePart}${utils_js_1.ANSI.dim}${'─'.repeat(right)}┐${utils_js_1.ANSI.reset}`;
        }
        return `${utils_js_1.ANSI.dim}└${'─'.repeat(width - 2)}┘${utils_js_1.ANSI.reset}`;
    }
}
exports.ThemeSelectorPanel = ThemeSelectorPanel;
//# sourceMappingURL=theme-selector.js.map