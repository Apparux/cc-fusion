"use strict";
/**
 * layout.ts — Layout calculation and panel management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Layout = void 0;
class Layout {
    constructor() {
        this.config = {
            previewHeight: 5,
            themeSelectorHeight: 3,
            helpHeight: 2,
            contentSplitRatio: 0.3,
        };
    }
    calculate(terminalWidth, terminalHeight) {
        const minHeight = 20;
        if (terminalHeight < minHeight) {
            terminalHeight = minHeight;
        }
        let currentY = 0;
        const preview = {
            x: 0,
            y: currentY,
            width: terminalWidth,
            height: Math.max(3, Math.min(this.config.previewHeight, Math.floor(terminalHeight * 0.3))),
        };
        currentY += preview.height;
        const themeSelector = {
            x: 0,
            y: currentY,
            width: terminalWidth,
            height: Math.max(3, Math.min(this.config.themeSelectorHeight, Math.floor(terminalHeight * 0.15))),
        };
        currentY += themeSelector.height;
        const help = {
            x: 0,
            y: terminalHeight - this.config.helpHeight,
            width: terminalWidth,
            height: this.config.helpHeight,
        };
        const contentHeight = Math.max(5, terminalHeight - currentY - this.config.helpHeight);
        const splitWidth = Math.floor(terminalWidth * this.config.contentSplitRatio);
        const presetSelector = {
            x: 0,
            y: currentY,
            width: splitWidth,
            height: contentHeight,
        };
        const settings = {
            x: splitWidth,
            y: currentY,
            width: terminalWidth - splitWidth,
            height: contentHeight,
        };
        return {
            preview,
            themeSelector,
            presetSelector,
            settings,
            help,
        };
    }
    setPreviewHeight(height) {
        this.config.previewHeight = Math.max(3, Math.min(8, height));
    }
    setThemeSelectorHeight(height) {
        this.config.themeSelectorHeight = Math.max(2, Math.min(5, height));
    }
}
exports.Layout = Layout;
//# sourceMappingURL=layout.js.map