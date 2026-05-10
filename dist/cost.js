"use strict";
/**
 * cost.ts — Cost display + smart hiding for Bedrock/Vertex
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCost = renderCost;
const stdin_js_1 = require("./stdin.js");
const utils_js_1 = require("./utils.js");
function renderCost(stdin, theme, config, i18n) {
    const cost = stdin.cost?.total_cost_usd;
    // Hide if no cost data
    if (cost === undefined || cost === null)
        return null;
    // Smart hide for Bedrock/Vertex (cost is 0 or not tracked)
    const providerName = `${(0, stdin_js_1.getProvider)(stdin) || ''} ${stdin.model?.id || ''}`.toLowerCase();
    for (const provider of config.hideCostFor) {
        if (providerName.includes(provider.toLowerCase()) && cost === 0) {
            return null;
        }
    }
    // Hide if cost is exactly 0 (likely not tracked)
    if (cost === 0)
        return null;
    const icon = theme.icons.cost ? `${(0, utils_js_1.colorize)(theme.icons.cost, theme.colors.costColor)} ` : '';
    const costStr = (0, utils_js_1.colorize)((0, utils_js_1.formatCost)(cost), theme.colors.costColor);
    return `${icon}${costStr}`;
}
//# sourceMappingURL=cost.js.map