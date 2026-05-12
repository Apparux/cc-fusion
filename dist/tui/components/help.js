"use strict";
/**
 * help.ts — Help panel component
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpPanel = void 0;
const utils_js_1 = require("../../utils.js");
class HelpPanel {
    render(rect, focusedPanel) {
        const output = [];
        const shortcuts = this.getShortcuts(focusedPanel);
        const line = shortcuts.join('  ');
        const padded = this.padLine(line, rect.width);
        output.push(`${utils_js_1.ANSI.dim}${padded}${utils_js_1.ANSI.reset}`);
        return output;
    }
    getShortcuts(focusedPanel) {
        const common = [
            (0, utils_js_1.colorize)('Tab', utils_js_1.ANSI.cyan) + ':switch',
            (0, utils_js_1.colorize)('↑↓', utils_js_1.ANSI.cyan) + ':navigate',
            (0, utils_js_1.colorize)('Enter', utils_js_1.ANSI.cyan) + ':select',
            (0, utils_js_1.colorize)('S', utils_js_1.ANSI.cyan) + ':save',
            (0, utils_js_1.colorize)('Q/Esc', utils_js_1.ANSI.cyan) + ':quit',
        ];
        if (focusedPanel === 'theme') {
            return [(0, utils_js_1.colorize)('1-6', utils_js_1.ANSI.cyan) + ':quick switch', ...common];
        }
        return common;
    }
    padLine(line, width) {
        const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');
        const visible = stripAnsi(line);
        const padding = Math.max(0, width - visible.length);
        return line + ' '.repeat(padding);
    }
}
exports.HelpPanel = HelpPanel;
//# sourceMappingURL=help.js.map