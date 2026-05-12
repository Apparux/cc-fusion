"use strict";
/**
 * preset-selector.ts — Preset selector panel component
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetSelectorPanel = void 0;
const utils_js_1 = require("../../utils.js");
const PRESETS = [
    { name: 'full', desc: 'full multi-line layout with all elements' },
    { name: 'essential', desc: '2 lines with model, git, context, usage, and cost' },
    { name: 'minimal', desc: '1 line with model and context only' },
];
class PresetSelectorPanel {
    constructor() {
        this.selectedIndex = 0;
    }
    render(rect, currentPreset, focused) {
        const output = [];
        const border = this.renderBorder(rect.width, 'Presets');
        output.push(border);
        if (!focused) {
            const presetIndex = PRESETS.findIndex(p => p.name === currentPreset);
            if (presetIndex !== -1) {
                this.selectedIndex = presetIndex;
            }
        }
        for (let i = 0; i < PRESETS.length; i++) {
            const preset = PRESETS[i];
            const isCurrent = preset.name === currentPreset;
            const isSelected = i === this.selectedIndex && focused;
            let display = `${preset.name}`;
            if (isCurrent && isSelected) {
                display = (0, utils_js_1.colorize)(`▶ ${display}`, utils_js_1.ANSI.cyan);
            }
            else if (isCurrent) {
                display = (0, utils_js_1.colorize)(`● ${display}`, utils_js_1.ANSI.green);
            }
            else if (isSelected) {
                display = (0, utils_js_1.colorize)(`  ${display}`, utils_js_1.ANSI.cyan);
            }
            else {
                display = `  ${display}`;
            }
            const line = this.padLine(`${display}`, rect.width - 4);
            output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${line} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
            const descLine = this.padLine(`  ${utils_js_1.ANSI.dim}${preset.desc}${utils_js_1.ANSI.reset}`, rect.width - 4);
            output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${descLine} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
        }
        while (output.length < rect.height - 1) {
            const emptyLine = this.padLine('', rect.width - 4);
            output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${emptyLine} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
        }
        output.push(this.renderBorder(rect.width, ''));
        return output;
    }
    moveSelection(delta) {
        this.selectedIndex = (this.selectedIndex + delta + PRESETS.length) % PRESETS.length;
    }
    getSelectedPreset() {
        return PRESETS[this.selectedIndex].name;
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
    padLine(line, width) {
        const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');
        const visible = stripAnsi(line);
        const padding = Math.max(0, width - visible.length);
        return line + ' '.repeat(padding);
    }
}
exports.PresetSelectorPanel = PresetSelectorPanel;
//# sourceMappingURL=preset-selector.js.map