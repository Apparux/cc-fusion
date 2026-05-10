"use strict";
/**
 * context.ts — Context bar + traffic-light rendering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContext = renderContext;
const stdin_js_1 = require("./stdin.js");
const utils_js_1 = require("./utils.js");
function renderContext(stdin, theme, opts, i18n) {
    const max = (0, stdin_js_1.getContextWindowSize)(stdin) || 200000;
    const { input, output, cacheCreate, cacheRead } = (0, stdin_js_1.getContextTokens)(stdin);
    const pct = (0, stdin_js_1.calcContextPct)(stdin);
    const level = (0, utils_js_1.contextTrafficLight)(pct);
    const color = (0, utils_js_1.trafficColor)(level, theme);
    const icon = theme.icons.context ? `${(0, utils_js_1.colorize)(theme.icons.context, theme.colors.contextColor)} ` : '';
    const bar = (0, utils_js_1.progressBar)(pct, opts.width, '█', '░', theme.colors.barFill, theme.colors.barEmpty);
    const wrappedBar = theme.name === 'neon' ? `${(0, utils_js_1.colorize)('[', theme.colors.dim)}${bar}${(0, utils_js_1.colorize)(']', theme.colors.dim)}` : bar;
    const pctStr = (0, utils_js_1.colorize)((0, utils_js_1.bold)(`${pct}%`), color);
    let line = `${icon}${i18n.context || 'Ctx'} ${wrappedBar} ${pctStr}`;
    if (pct >= opts.tokenBreakdownThreshold) {
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