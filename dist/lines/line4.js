/**
 * line4.ts — Task progress line
 */
import { COLORS, colorize } from '../colors.js';
import { firstSeparatorTargetWidth, joinWithAlignedFirstSeparator } from '../utils.js';
export function renderLine4(ctx) {
    const parts = [];
    // 💤 Tasks label
    parts.push(colorize('💤 Tasks', COLORS.purple));
    // Task list
    if (ctx.tools.todos.length > 0) {
        for (const todo of ctx.tools.todos) {
            const icon = todo.status === 'done' ? '✅' :
                todo.status === 'current' ? '⚡' :
                    todo.status === 'pending' ? '⏳' : '🕒';
            const text = todo.source === 'trellis'
                ? `${icon} ${todo.name}`
                : `${icon} ${todo.id}/${ctx.tools.totalTodos} ${todo.name}`;
            const color = todo.status === 'done' ? COLORS.green :
                todo.status === 'current' ? COLORS.yellow :
                    COLORS.dim;
            parts.push(colorize(text, color));
            if (todo.statusLabel) {
                parts.push(colorize(todo.statusLabel, color));
            }
        }
        // Overall progress percentage for Claude Code Todo lists.
        if (!ctx.tools.todos.some(todo => todo.source === 'trellis')) {
            const progressPct = Math.round((ctx.tools.doneTodos / ctx.tools.totalTodos) * 100);
            parts.push(colorize(`${progressPct}%`, COLORS.purple));
        }
    }
    else {
        parts.push(colorize('无待办任务', COLORS.dim));
    }
    return joinWithAlignedFirstSeparator(parts, firstSeparatorTargetWidth(ctx.model));
}
//# sourceMappingURL=line4.js.map