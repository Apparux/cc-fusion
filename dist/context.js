"use strict";
/**
 * context.ts — Context bar + traffic-light rendering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContext = renderContext;
const utils_js_1 = require("./utils.js");
function renderContext(stdin, theme, opts, i18n) {
    const max = stdin.max_context_window_size || 200000;
    const ctx = stdin.context_window || {};
    const input = ctx.input_tokens || 0;
    const output = ctx.output_tokens || 0;
    const cacheCreate = ctx.cache_creation_input_tokens || 0;
    const cacheRead = ctx.cache_read_input_tokens || 0;
    const total = input + output + cacheCreate + cacheRead;
    const pct = Math.min(100, Math.round((total / max) * 100));
    const level = (0, utils_js_1.contextTrafficLight)(pct);
    const color = (0, utils_js_1.trafficColor)(level, theme);
    const icon = (0, utils_js_1.colorize)(theme.icons.context, theme.colors.contextColor);
    const bar = (0, utils_js_1.progressBar)(pct, opts.width, '█', '░', color, theme.colors.dim);
    const pctStr = (0, utils_js_1.colorize)((0, utils_js_1.bold)(`${pct}%`), color);
    let line = `${icon} ${i18n.context || 'Ctx'} ${bar} ${pctStr}`;
    // Show token breakdown when ≥85%
    if (opts.showBreakdown && pct >= 85) {
        const parts = [];
        parts.push(`${(0, utils_js_1.colorize)('I', utils_js_1.ANSI.cyan)}${(0, utils_js_1.formatTokens)(input)}`);
        parts.push(`${(0, utils_js_1.colorize)('O', utils_js_1.ANSI.green)}${(0, utils_js_1.formatTokens)(output)}`);
        if (cacheCreate > 0)
            parts.push(`${(0, utils_js_1.colorize)('W', utils_js_1.ANSI.orange)}${(0, utils_js_1.formatTokens)(cacheCreate)}`);
        if (cacheRead > 0)
            parts.push(`${(0, utils_js_1.colorize)('R', utils_js_1.ANSI.brightBlue)}${(0, utils_js_1.formatTokens)(cacheRead)}`);
        line += ` ${(0, utils_js_1.colorize)('(', theme.colors.dim)}${parts.join((0, utils_js_1.colorize)('/', theme.colors.dim))}${(0, utils_js_1.colorize)(')', theme.colors.dim)}`;
    }
    return line;
}
//# sourceMappingURL=context.js.map