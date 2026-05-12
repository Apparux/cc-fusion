/**
 * layout.ts — Layout calculation and panel management
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  previewHeight: number;
  themeSelectorHeight: number;
  helpHeight: number;
  contentSplitRatio: number;
}

export class Layout {
  private config: LayoutConfig = {
    previewHeight: 5,
    themeSelectorHeight: 3,
    helpHeight: 2,
    contentSplitRatio: 0.3,
  };

  calculate(terminalWidth: number, terminalHeight: number): {
    preview: Rect;
    themeSelector: Rect;
    presetSelector: Rect;
    settings: Rect;
    help: Rect;
  } {
    let currentY = 0;

    const preview: Rect = {
      x: 0,
      y: currentY,
      width: terminalWidth,
      height: Math.min(this.config.previewHeight, Math.floor(terminalHeight * 0.3)),
    };
    currentY += preview.height;

    const themeSelector: Rect = {
      x: 0,
      y: currentY,
      width: terminalWidth,
      height: Math.min(this.config.themeSelectorHeight, Math.floor(terminalHeight * 0.15)),
    };
    currentY += themeSelector.height;

    const help: Rect = {
      x: 0,
      y: terminalHeight - this.config.helpHeight,
      width: terminalWidth,
      height: this.config.helpHeight,
    };

    const contentHeight = terminalHeight - currentY - this.config.helpHeight;
    const splitWidth = Math.floor(terminalWidth * this.config.contentSplitRatio);

    const presetSelector: Rect = {
      x: 0,
      y: currentY,
      width: splitWidth,
      height: contentHeight,
    };

    const settings: Rect = {
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

  setPreviewHeight(height: number): void {
    this.config.previewHeight = Math.max(3, Math.min(8, height));
  }

  setThemeSelectorHeight(height: number): void {
    this.config.themeSelectorHeight = Math.max(2, Math.min(5, height));
  }
}
