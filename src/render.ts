/**
 * render.ts — Main render engine: composes 5 fixed lines
 */

import type { RenderContext } from './types.js';
import { renderLine1 } from './lines/line1.js';
import { renderLine2 } from './lines/line2.js';
import { renderLine3 } from './lines/line3.js';
import { renderLine4 } from './lines/line4.js';
import { renderLine5 } from './lines/line5.js';

export function render(ctx: RenderContext): string {
  const lines: string[] = [
    renderLine1(ctx),
    renderLine2(ctx),
    renderLine3(ctx),
    renderLine4(ctx),
    renderLine5(ctx),
  ];

  return lines.join('\n');
}
