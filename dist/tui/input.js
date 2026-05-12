"use strict";
/**
 * input.ts — Keyboard input handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputManager = void 0;
const readline_1 = require("readline");
const process_1 = require("process");
class InputManager {
    constructor() {
        this.rl = null;
        this.handlers = [];
        this.active = false;
    }
    start() {
        if (this.active)
            return;
        if (!process_1.stdin.isTTY) {
            throw new Error('TUI requires a TTY environment. Use "cc-fusion init" for CLI configuration.');
        }
        this.rl = (0, readline_1.createInterface)({
            input: process_1.stdin,
            output: process_1.stdout,
            terminal: true,
        });
        if (process_1.stdin.setRawMode) {
            process_1.stdin.setRawMode(true);
        }
        process_1.stdin.setEncoding('utf8');
        process_1.stdin.on('data', this.handleData.bind(this));
        this.active = true;
    }
    stop() {
        if (!this.active)
            return;
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
        if (process_1.stdin.isTTY && process_1.stdin.setRawMode) {
            process_1.stdin.setRawMode(false);
        }
        process_1.stdin.removeAllListeners('data');
        this.active = false;
    }
    onKey(handler) {
        this.handlers.push(handler);
        return () => {
            const index = this.handlers.indexOf(handler);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        };
    }
    handleData(data) {
        const str = data.toString();
        const key = this.parseKey(str);
        for (const handler of this.handlers) {
            handler(key);
        }
    }
    parseKey(str) {
        const ctrl = str.charCodeAt(0) < 32;
        const shift = false;
        const meta = false;
        if (str === '\x1b[A') {
            return { name: 'up', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x1b[B') {
            return { name: 'down', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x1b[C') {
            return { name: 'right', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x1b[D') {
            return { name: 'left', ctrl, shift, meta, sequence: str };
        }
        if (str === '\t') {
            return { name: 'tab', ctrl, shift, meta, sequence: str };
        }
        if (str === '\r' || str === '\n') {
            return { name: 'enter', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x1b') {
            return { name: 'escape', ctrl, shift, meta, sequence: str };
        }
        if (str === ' ') {
            return { name: 'space', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x7f' || str === '\b') {
            return { name: 'backspace', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x1b[3~') {
            return { name: 'delete', ctrl, shift, meta, sequence: str };
        }
        if (str === '\x03') {
            return { name: 'escape', ctrl: true, shift, meta, sequence: str };
        }
        const lower = str.toLowerCase();
        if (lower === 's' || lower === 'q' || /^[1-6]$/.test(lower)) {
            return { name: lower, ctrl, shift, meta, sequence: str };
        }
        return { name: str, ctrl, shift, meta, sequence: str };
    }
}
exports.InputManager = InputManager;
//# sourceMappingURL=input.js.map