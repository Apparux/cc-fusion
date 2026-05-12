"use strict";
/**
 * screen.ts — Terminal screen management and rendering
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = void 0;
const ansi_escapes_1 = __importDefault(require("ansi-escapes"));
const cli_cursor_1 = __importDefault(require("cli-cursor"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
class Screen {
    constructor() {
        this.cleanupHandlers = [];
        if (!process.stdout.isTTY) {
            throw new Error('Cannot run TUI in non-interactive environment. Please run cc-fusion config in a real terminal (not through Claude Code or pipes).');
        }
        const width = process.stdout.columns;
        const height = process.stdout.rows;
        if (!width || !height || width < 40 || height < 20) {
            throw new Error(`Terminal too small or invalid (${width}x${height}). Please run cc-fusion config in a properly sized terminal (minimum 40x20).`);
        }
        this.state = {
            width,
            height,
            lines: [],
            cursorVisible: true,
        };
        this.installCleanupHandlers();
        this.installResizeHandler();
    }
    installCleanupHandlers() {
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
    installResizeHandler() {
        const handler = () => {
            this.state.width = process.stdout.columns || 80;
            this.state.height = process.stdout.rows || 24;
        };
        process.stdout.on('resize', handler);
    }
    enterAltScreen() {
        process.stdout.write('\x1b[?1049h');
        process.stdout.write(ansi_escapes_1.default.clearScreen);
        process.stdout.write(ansi_escapes_1.default.cursorTo(0, 0));
    }
    exitAltScreen() {
        process.stdout.write(ansi_escapes_1.default.clearScreen);
        process.stdout.write('\x1b[?1049l');
    }
    hideCursor() {
        cli_cursor_1.default.hide();
        this.state.cursorVisible = false;
    }
    showCursor() {
        cli_cursor_1.default.show();
        this.state.cursorVisible = true;
    }
    clear() {
        process.stdout.write(ansi_escapes_1.default.clearScreen);
        process.stdout.write(ansi_escapes_1.default.cursorTo(0, 0));
    }
    render(lines) {
        const output = [];
        output.push(ansi_escapes_1.default.cursorTo(0, 0));
        output.push(ansi_escapes_1.default.eraseDown);
        const maxLines = Math.min(lines.length, this.state.height);
        for (let i = 0; i < maxLines; i++) {
            const line = lines[i] || '';
            const truncated = this.truncateLine(line, this.state.width);
            output.push(truncated);
            if (i < maxLines - 1) {
                output.push('\n');
            }
        }
        process.stdout.write(output.join(''));
        this.state.lines = lines;
    }
    truncateLine(line, maxWidth) {
        const visible = (0, strip_ansi_1.default)(line);
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
            }
            else {
                visibleCount++;
            }
        }
        return result + '…\x1b[0m';
    }
    getSize() {
        return {
            width: this.state.width,
            height: this.state.height,
        };
    }
    cleanup() {
        this.showCursor();
        this.exitAltScreen();
    }
}
exports.Screen = Screen;
//# sourceMappingURL=screen.js.map