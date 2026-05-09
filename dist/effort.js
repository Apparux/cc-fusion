"use strict";
/**
 * effort.ts — Effort level + color
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEffort = renderEffort;
const utils_js_1 = require("./utils.js");
function renderEffort(stdin, theme, i18n) {
    const effort = stdin.effortLevel;
    if (!effort)
        return null;
    const level = (0, utils_js_1.effortTrafficLight)(effort);
    const color = (0, utils_js_1.trafficColor)(level, theme);
    const icon = (0, utils_js_1.colorize)(theme.icons.effort, color);
    return `${icon} ${(0, utils_js_1.colorize)(effort, color)}`;
}
//# sourceMappingURL=effort.js.map