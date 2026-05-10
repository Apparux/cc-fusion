/**
 * cost.ts — Cost display + smart hiding for Bedrock/Vertex
 */

import type { Theme, StdinData, Config } from './types.js';
import { getProvider } from './stdin.js';
import { colorize, formatCost } from './utils.js';

export function renderCost(
  stdin: StdinData,
  theme: Theme,
  config: Config,
  i18n: Record<string, string>
): string | null {
  const cost = stdin.cost?.total_cost_usd;

  // Hide if no cost data
  if (cost === undefined || cost === null) return null;

  // Smart hide for Bedrock/Vertex (cost is 0 or not tracked)
  const providerName = `${getProvider(stdin) || ''} ${stdin.model?.id || ''}`.toLowerCase();
  for (const provider of config.hideCostFor) {
    if (providerName.includes(provider.toLowerCase()) && cost === 0) {
      return null;
    }
  }

  // Hide if cost is exactly 0 (likely not tracked)
  if (cost === 0) return null;

  const icon = theme.icons.cost ? `${colorize(theme.icons.cost, theme.colors.costColor)} ` : '';
  const costStr = colorize(formatCost(cost), theme.colors.costColor);

  return `${icon}${costStr}`;
}
