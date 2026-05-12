"use strict";
/**
 * settings.ts — Settings panel component
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsPanel = void 0;
const utils_js_1 = require("../../utils.js");
const ELEMENTS = ['usage', 'cost', 'duration', 'effort', 'tools', 'agents', 'todos'];
const SETTINGS = [
    { key: 'lang', label: 'Language', type: 'select', options: ['en', 'zh'] },
    { key: 'showTranscript', label: 'Show Transcript', type: 'boolean' },
    { key: 'barWidth', label: 'Bar Width', type: 'number', min: 5, max: 60 },
    { key: 'usageThreshold', label: 'Usage Threshold', type: 'number', min: 1, max: 100 },
    { key: 'tokenBreakdownThreshold', label: 'Token Breakdown Threshold', type: 'number', min: 1, max: 100 },
    { key: 'elements', label: 'Elements', type: 'elements' },
];
class SettingsPanel {
    constructor() {
        this.selectedIndex = 0;
        this.elementSelectedIndex = 0;
        this.editingNumber = false;
        this.numberBuffer = '';
    }
    render(rect, config, focused) {
        const output = [];
        const border = this.renderBorder(rect.width, 'Settings');
        output.push(border);
        let lineIndex = 0;
        for (let i = 0; i < SETTINGS.length && lineIndex < rect.height - 2; i++) {
            const setting = SETTINGS[i];
            const isSelected = i === this.selectedIndex && focused;
            if (setting.type === 'elements') {
                const elementsLines = this.renderElements(config, isSelected, rect.width - 4);
                for (const line of elementsLines) {
                    if (lineIndex >= rect.height - 2)
                        break;
                    output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${line} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
                    lineIndex++;
                }
            }
            else {
                const line = this.renderSetting(setting, config, isSelected, rect.width - 4);
                output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${line} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
                lineIndex++;
            }
        }
        while (output.length < rect.height - 1) {
            const emptyLine = this.padLine('', rect.width - 4);
            output.push(`${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset} ${emptyLine} ${utils_js_1.ANSI.dim}│${utils_js_1.ANSI.reset}`);
        }
        output.push(this.renderBorder(rect.width, ''));
        return output;
    }
    renderSetting(setting, config, isSelected, width) {
        const value = config[setting.key];
        let valueStr = '';
        if (setting.type === 'boolean') {
            valueStr = value ? (0, utils_js_1.colorize)('✓ true', utils_js_1.ANSI.green) : (0, utils_js_1.colorize)('✗ false', utils_js_1.ANSI.red);
        }
        else if (setting.type === 'number') {
            if (this.editingNumber && isSelected) {
                valueStr = (0, utils_js_1.colorize)(this.numberBuffer || String(value), utils_js_1.ANSI.cyan);
            }
            else {
                valueStr = String(value);
            }
        }
        else if (setting.type === 'select') {
            valueStr = (0, utils_js_1.colorize)(String(value), utils_js_1.ANSI.cyan);
        }
        const prefix = isSelected ? (0, utils_js_1.colorize)('▶', utils_js_1.ANSI.cyan) : ' ';
        const label = isSelected ? (0, utils_js_1.colorize)(setting.label, utils_js_1.ANSI.cyan) : setting.label;
        const display = `${prefix} ${label}: ${valueStr}`;
        return this.padLine(display, width);
    }
    renderElements(config, isSelected, width) {
        const lines = [];
        const prefix = isSelected ? (0, utils_js_1.colorize)('▶', utils_js_1.ANSI.cyan) : ' ';
        const label = isSelected ? (0, utils_js_1.colorize)('Elements:', utils_js_1.ANSI.cyan) : 'Elements:';
        lines.push(this.padLine(`${prefix} ${label}`, width));
        for (let i = 0; i < ELEMENTS.length; i++) {
            const element = ELEMENTS[i];
            const enabled = config.elements?.[element] !== false;
            const isElementSelected = isSelected && i === this.elementSelectedIndex;
            const checkbox = enabled ? (0, utils_js_1.colorize)('☑', utils_js_1.ANSI.green) : (0, utils_js_1.colorize)('☐', utils_js_1.ANSI.dim);
            const elementLabel = isElementSelected ? (0, utils_js_1.colorize)(element, utils_js_1.ANSI.cyan) : element;
            const display = `    ${checkbox} ${elementLabel}`;
            lines.push(this.padLine(display, width));
        }
        return lines;
    }
    moveSelection(delta) {
        this.selectedIndex = (this.selectedIndex + delta + SETTINGS.length) % SETTINGS.length;
        this.elementSelectedIndex = 0;
        this.editingNumber = false;
        this.numberBuffer = '';
    }
    moveElementSelection(delta) {
        if (SETTINGS[this.selectedIndex].type === 'elements') {
            this.elementSelectedIndex = (this.elementSelectedIndex + delta + ELEMENTS.length) % ELEMENTS.length;
        }
    }
    toggleCurrentSetting(config) {
        const setting = SETTINGS[this.selectedIndex];
        if (setting.type === 'boolean') {
            return { ...config, [setting.key]: !config[setting.key] };
        }
        else if (setting.type === 'select' && setting.options) {
            const currentValue = config[setting.key];
            const currentIndex = setting.options.indexOf(currentValue);
            const nextIndex = (currentIndex + 1) % setting.options.length;
            return { ...config, [setting.key]: setting.options[nextIndex] };
        }
        else if (setting.type === 'elements') {
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
    startEditingNumber(config) {
        const setting = SETTINGS[this.selectedIndex];
        if (setting.type === 'number') {
            this.editingNumber = true;
            this.numberBuffer = String(config[setting.key]);
        }
    }
    handleNumberInput(char) {
        if (/^\d$/.test(char)) {
            this.numberBuffer += char;
        }
    }
    handleBackspace() {
        if (this.editingNumber && this.numberBuffer.length > 0) {
            this.numberBuffer = this.numberBuffer.slice(0, -1);
        }
    }
    finishEditingNumber(config) {
        if (!this.editingNumber)
            return config;
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
    cancelEditingNumber() {
        this.editingNumber = false;
        this.numberBuffer = '';
    }
    isEditingNumber() {
        return this.editingNumber;
    }
    isOnElementsSetting() {
        return SETTINGS[this.selectedIndex].type === 'elements';
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
exports.SettingsPanel = SettingsPanel;
//# sourceMappingURL=settings.js.map