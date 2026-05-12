/**
 * render.ts — Main render engine: composes 5 fixed lines
 */
import { renderLine1 } from './lines/line1.js';
import { renderLine2 } from './lines/line2.js';
import { renderLine3 } from './lines/line3.js';
import { renderLine4 } from './lines/line4.js';
import { renderLine5 } from './lines/line5.js';
/**
 * Render all 5 statusline rows
 */
export function render(ctx) {
    const lines = [
        renderLine1(ctx),
        renderLine2(ctx),
        renderLine3(ctx),
        renderLine4(ctx),
        renderLine5(ctx),
    ];
    return lines.join('\n');
}
//# sourceMappingURL=render.js.map