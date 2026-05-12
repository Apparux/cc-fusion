/**
 * input.ts — Keyboard input handling
 */

import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';

export type KeyName =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'tab'
  | 'enter'
  | 'escape'
  | 'space'
  | 'backspace'
  | 'delete'
  | 's'
  | 'q'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6';

export interface KeyPress {
  name: KeyName | string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
  sequence: string;
}

export type KeyHandler = (key: KeyPress) => void | Promise<void>;

export class InputManager {
  private rl: ReturnType<typeof createInterface> | null = null;
  private handlers: KeyHandler[] = [];
  private active = false;

  start(): void {
    if (this.active) return;

    if (!input.isTTY) {
      throw new Error('TUI requires a TTY environment. Use "cc-fusion init" for CLI configuration.');
    }

    this.rl = createInterface({
      input,
      output,
      terminal: true,
    });

    if (input.setRawMode) {
      input.setRawMode(true);
    }
    input.setEncoding('utf8');

    input.on('data', this.handleData.bind(this));

    this.active = true;
  }

  stop(): void {
    if (!this.active) return;

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    if (input.isTTY && input.setRawMode) {
      input.setRawMode(false);
    }

    input.removeAllListeners('data');

    this.active = false;
  }

  onKey(handler: KeyHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  private handleData(data: Buffer | string): void {
    const str = data.toString();
    const key = this.parseKey(str);

    for (const handler of this.handlers) {
      handler(key);
    }
  }

  private parseKey(str: string): KeyPress {
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
      return { name: lower as KeyName, ctrl, shift, meta, sequence: str };
    }

    return { name: str, ctrl, shift, meta, sequence: str };
  }
}
