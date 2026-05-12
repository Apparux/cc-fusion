/**
 * line1.ts — Core info line (model, project, git)
 */
import { COLORS, colorize } from '../colors.js';
export function renderLine1(ctx) {
    const parts = [];
    // 👾 Model
    parts.push(colorize(`👾 ${ctx.model}`, COLORS.purple));
    // 🗃️ Project
    parts.push(colorize(`🗃️ ${ctx.project}`, COLORS.orange));
    // 🫯 Git branch + status
    if (ctx.git) {
        const status = ctx.git.dirty ? '⚠️' : '✅';
        parts.push(colorize(`🫯 ${ctx.git.branch} ${status}`, COLORS.yellow));
    }
    return parts.join(colorize('  |  ', COLORS.gray));
}
//# sourceMappingURL=line1.js.map