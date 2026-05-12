/**
 * screen.ts — Terminal screen management and rendering
 */

import ansiEscapes from 'ansi-escapes';
import cliCursor from 'cli-cursor';
import stripAnsi from 'strip-ansi';

export interface ScreenState {
  width: number;
  height: number;
  lines: string[];
  cursorVisible: boolean;
}

export class Screen {
  private state: ScreenState;
  private cleanupHandlers: Array<() => void> = [];

  constructor() {
    this.state = {
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      lines: [],
      cursorVisible: true,
    };

    this.installCleanupHandlers();
    this.installResizeHandler();
  }

  private installCleanupHandlers(): void {
    const cleanup = () => {
      this.showCursor();
      this.exitAltScreen();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(130);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(143);
    });
    process.on('uncaughtException', (err) => {
      cleanup();
      console.error('Uncaught exception:', err);
      process.exit(1);
    });

    this.cleanupHandlers.push(cleanup);
  }

  private installResizeHandler(): void {
    const handler = () => {
      this.state.width = process.stdout.columns || 80;
      this.state.height = process.stdout.rows || 24;
    };
    process.stdout.on('resize', handler);
  }

  enterAltScreen(): void {
    process.stdout.write(ansiEscapes.clearScreen);
    process.stdout.write(ansiEscapes.cursorTo(0, 0));
  }

  exitAltScreen(): void {
    process.stdout.write(ansiEscapes.clearScreen);
    process.stdout.write(ansiEscapes.cursorTo(0, 0));
  }

  hideCursor(): void {
    cliCursor.hide();
    this.state.cursorVisible = false;
  }

  showCursor(): void {
    cliCursor.show();
    this.state.cursorVisible = true;
  }

  clear(): void {
    process.stdout.write(ansiEscapes.clearScreen);
    process.stdout.write(ansiEscapes.cursorTo(0, 0));
  }

  render(lines: string[]): void {
    const output: string[] = [];

    output.push(ansiEscapes.cursorTo(0, 0));

    for (let i = 0; i < Math.min(lines.length, this.state.height); i++) {
      const line = lines[i] || '';
      const truncated = this.truncateLine(line, this.state.width);
      output.push(truncated);
      output.push(ansiEscapes.eraseLine);
      if (i < lines.length - 1) {
        output.push('\n');
      }
    }

    for (let i = lines.length; i < this.state.height; i++) {
      output.push(ansiEscapes.eraseLine);
      if (i < this.state.height - 1) {
        output.push('\n');
      }
    }

    process.stdout.write(output.join(''));
    this.state.lines = lines;
  }

  private truncateLine(line: string, maxWidth: number): string {
    const visible = stripAnsi(line);
    if (visible.length <= maxWidth) {
      return line;
    }

    let result = '';
    let visibleCount = 0;
    let inEscape = false;

    for (let i = 0; i < line.length && visibleCount < maxWidth - 1; i++) {
      const char = line[i];

      if (char === '\x1b') {
        inEscape = true;
      }

      result += char;

      if (inEscape) {
        if (char === 'm') {
          inEscape = false;
        }
      } else {
        visibleCount++;
      }
    }

    return result + '…\x1b[0m';
  }

  getSize(): { width: number; height: number } {
    return {
      width: this.state.width,
      height: this.state.height,
    };
  }

  cleanup(): void {
    this.showCursor();
    this.exitAltScreen();
  }
}
