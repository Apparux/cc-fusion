"use strict";
/**
 * usage.ts — Usage bar + traffic-light + reset countdown
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderUsage = renderUsage;
const stdin_js_1 = require("./stdin.js");
const utils_js_1 = require("./utils.js");
function renderUsage(stdin, theme, opts, i18n) {
    const usage = (0, stdin_js_1.extractUsageInfo)(stdin);
    if (!usage || usage.pct < opts.threshold)
        return null;
    const level = (0, utils_js_1.usageTrafficLight)(usage.pct);
    const color = (0, utils_js_1.trafficColor)(level, theme);
    const icon = theme.icons.usage ? `${(0, utils_js_1.colorize)(theme.icons.usage, theme.colors.usageColor)} ` : '';
    const bar = (0, utils_js_1.progressBar)(usage.pct, opts.width, '█', '░', theme.colors.barFill, theme.colors.barEmpty);
    const wrappedBar = theme.name === 'neon' ? `${(0, utils_js_1.colorize)('[', theme.colors.dim)}${bar}${(0, utils_js_1.colorize)(']', theme.colors.dim)}` : bar;
    const pctStr = (0, utils_js_1.colorize)((0, utils_js_1.bold)(`${usage.pct}%`), color);
    let line = `${icon}${i18n.usage || 'Use'} ${wrappedBar} ${pctStr}`;
    if (usage.resetAt) {
        const remainingMs = usage.resetAt - Date.now();
        if (remainingMs > 0) {
            const resetLabel = i18n.reset || 'reset';
            line += ` ${(0, utils_js_1.colorize)(`(${resetLabel} ${(0, utils_js_1.formatDuration)(remainingMs)})`, theme.colors.dim)}`;
        }
    }
    return line;
}
//# sourceMappingURL=usage.js.map