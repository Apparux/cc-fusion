"use strict";
/**
 * app.ts — Main TUI application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TUIApp = void 0;
const config_js_1 = require("../config.js");
const screen_js_1 = require("./screen.js");
const input_js_1 = require("./input.js");
const layout_js_1 = require("./layout.js");
const preview_js_1 = require("./components/preview.js");
const theme_selector_js_1 = require("./components/theme-selector.js");
const preset_selector_js_1 = require("./components/preset-selector.js");
const settings_js_1 = require("./components/settings.js");
const help_js_1 = require("./components/help.js");
const fs_1 = require("fs");
class TUIApp {
    constructor() {
        this.focusedPanel = 'theme';
        this.running = false;
        this.needsRender = true;
        this.debounceTimer = null;
        this.screen = new screen_js_1.Screen();
        this.input = new input_js_1.InputManager();
        this.layout = new layout_js_1.Layout();
        this.previewPanel = new preview_js_1.PreviewPanel();
        this.themeSelectorPanel = new theme_selector_js_1.ThemeSelectorPanel();
        this.presetSelectorPanel = new preset_selector_js_1.PresetSelectorPanel();
        this.settingsPanel = new settings_js_1.SettingsPanel();
        this.helpPanel = new help_js_1.HelpPanel();
        this.config = (0, config_js_1.loadConfig)();
        this.theme = (0, config_js_1.loadTheme)(this.config.theme);
        this.preset = (0, config_js_1.loadPreset)(this.config.preset);
    }
    async run() {
        let error = null;
        try {
            this.screen.enterAltScreen();
            this.screen.hideCursor();
            this.input.start();
            this.input.onKey(this.handleKey.bind(this));
            this.running = true;
            this.needsRender = true;
            while (this.running) {
                if (this.needsRender) {
                    this.render();
                    this.needsRender = false;
                }
                await this.sleep(16);
            }
        }
        catch (err) {
            error = err instanceof Error ? err : new Error(String(err));
        }
        finally {
            this.cleanup();
        }
        if (error) {
            throw error;
        }
    }
    handleKey(key) {
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
                this.theme = (0, config_js_1.loadTheme)(newTheme);
                this.scheduleRender();
            }
            return;
        }
        if (this.settingsPanel.isEditingNumber()) {
            if (key.name === 'enter') {
                this.config = this.settingsPanel.finishEditingNumber(this.config);
                this.scheduleRender();
            }
            else if (key.name === 'escape') {
                this.settingsPanel.cancelEditingNumber();
                this.needsRender = true;
            }
            else if (key.name === 'backspace') {
                this.settingsPanel.handleBackspace();
                this.needsRender = true;
            }
            else if (/^\d$/.test(key.name)) {
                this.settingsPanel.handleNumberInput(key.name);
                this.needsRender = true;
            }
            return;
        }
        if (key.name === 'up') {
            this.handleUp();
            this.needsRender = true;
        }
        else if (key.name === 'down') {
            this.handleDown();
            this.needsRender = true;
        }
        else if (key.name === 'enter') {
            this.handleEnter();
        }
    }
    handleUp() {
        if (this.focusedPanel === 'theme') {
            this.themeSelectorPanel.moveSelection(-1);
        }
        else if (this.focusedPanel === 'preset') {
            this.presetSelectorPanel.moveSelection(-1);
        }
        else if (this.focusedPanel === 'settings') {
            if (this.settingsPanel.isOnElementsSetting()) {
                this.settingsPanel.moveElementSelection(-1);
            }
            else {
                this.settingsPanel.moveSelection(-1);
            }
        }
    }
    handleDown() {
        if (this.focusedPanel === 'theme') {
            this.themeSelectorPanel.moveSelection(1);
        }
        else if (this.focusedPanel === 'preset') {
            this.presetSelectorPanel.moveSelection(1);
        }
        else if (this.focusedPanel === 'settings') {
            if (this.settingsPanel.isOnElementsSetting()) {
                this.settingsPanel.moveElementSelection(1);
            }
            else {
                this.settingsPanel.moveSelection(1);
            }
        }
    }
    handleEnter() {
        if (this.focusedPanel === 'theme') {
            const newTheme = this.themeSelectorPanel.getSelectedTheme();
            this.config = { ...this.config, theme: newTheme };
            this.theme = (0, config_js_1.loadTheme)(newTheme);
            this.scheduleRender();
        }
        else if (this.focusedPanel === 'preset') {
            const newPreset = this.presetSelectorPanel.getSelectedPreset();
            this.config = { ...this.config, preset: newPreset };
            this.preset = (0, config_js_1.loadPreset)(newPreset);
            this.scheduleRender();
        }
        else if (this.focusedPanel === 'settings') {
            this.settingsPanel.startEditingNumber(this.config);
            if (!this.settingsPanel.isEditingNumber()) {
                this.config = this.settingsPanel.toggleCurrentSetting(this.config);
                this.scheduleRender();
            }
            else {
                this.needsRender = true;
            }
        }
    }
    switchPanel() {
        const panels = ['theme', 'preset', 'settings'];
        const currentIndex = panels.indexOf(this.focusedPanel);
        const nextIndex = (currentIndex + 1) % panels.length;
        this.focusedPanel = panels[nextIndex];
    }
    scheduleRender() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.needsRender = true;
            this.debounceTimer = null;
        }, 150);
    }
    render() {
        const size = this.screen.getSize();
        const rects = this.layout.calculate(size.width, size.height);
        const lines = [];
        const previewLines = this.previewPanel.render(rects.preview, this.config, this.theme, this.preset);
        lines.push(...previewLines);
        const themeLines = this.themeSelectorPanel.render(rects.themeSelector, this.config.theme, this.focusedPanel === 'theme');
        lines.push(...themeLines);
        const maxContentHeight = Math.max(rects.presetSelector.height, rects.settings.height);
        const presetLines = this.presetSelectorPanel.render({ ...rects.presetSelector, height: maxContentHeight }, this.config.preset, this.focusedPanel === 'preset');
        const settingsLines = this.settingsPanel.render({ ...rects.settings, height: maxContentHeight }, this.config, this.focusedPanel === 'settings');
        for (let i = 0; i < maxContentHeight; i++) {
            const presetLine = presetLines[i] || this.padLine('', rects.presetSelector.width);
            const settingsLine = settingsLines[i] || this.padLine('', rects.settings.width);
            lines.push(presetLine + settingsLine);
        }
        const helpLines = this.helpPanel.render(rects.help, this.focusedPanel);
        lines.push(...helpLines);
        this.screen.render(lines);
    }
    padLine(line, width) {
        const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');
        const visible = stripAnsi(line);
        const padding = Math.max(0, width - visible.length);
        return line + ' '.repeat(padding);
    }
    saveConfig() {
        try {
            const configPath = (0, config_js_1.getUserConfigPath)();
            const configDir = (0, config_js_1.getUserConfigDir)();
            (0, fs_1.mkdirSync)(configDir, { recursive: true });
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
            (0, fs_1.writeFileSync)(configPath, JSON.stringify(configToSave, null, 2) + '\n');
            this.running = false;
        }
        catch (err) {
            console.error('Failed to save config:', err);
        }
    }
    cleanup() {
        this.input.stop();
        this.screen.cleanup();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TUIApp = TUIApp;
//# sourceMappingURL=app.js.map