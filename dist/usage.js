"use strict";
/**
 * usage.ts — Usage bar + traffic-light + 7-day threshold
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderUsage = renderUsage;
const utils_js_1 = require("./utils.js");
function renderUsage(stdin, theme, opts, i18n) {
    const max = stdin.max_context_window_size || 200000;
    const ctx = stdin.context_window || {};
    const total = (ctx.input_tokens || 0) +
        (ctx.output_tokens || 0) +
        (ctx.cache_creation_input_tokens || 0) +
        (ctx.cache_read_input_tokens || 0);
    const pct = Math.min(100, Math.round((total / max) * 100));
    // Only show if above threshold (7-day usage rule)
    if (pct < opts.threshold)
        return null;
    const level = (0, utils_js_1.usageTrafficLight)(pct);
    const color = (0, utils_js_1.trafficColor)(level, theme);
    const icon = (0, utils_js_1.colorize)(theme.icons.usage, theme.colors.usageColor);
    const bar = (0, utils_js_1.progressBar)(pct, opts.width, '█', '░', color, theme.colors.dim);
    const pctStr = (0, utils_js_1.colorize)((0, utils_js_1.bold)(`${pct}%`), color);
    let line = `${icon} ${i18n.usage || 'Use'} ${bar} ${pctStr}`;
    if (opts.resetCountdown) {
        line += ` ${(0, utils_js_1.colorize)(`(${opts.resetCountdown})`, theme.colors.dim)}`;
    }
    return line;
}
//# sourceMappingURL=usage.js.map