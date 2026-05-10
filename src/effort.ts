/**
 * effort.ts — Effort level + color
 */

import type { Theme, StdinData } from './types.js';
import { getEffortLevel } from './stdin.js';
import { effortTrafficLight, trafficColor, colorize } from './utils.js';

export function renderEffort(
  stdin: StdinData,
  theme: Theme,
  i18n: Record<string, string>
): string | null {
  const effort = getEffortLevel(stdin);
  if (!effort) return null;

  const level = effortTrafficLight(effort);
  const color = trafficColor(level, theme);
  const icon = colorize(theme.icons.effort, color);

  return `${icon} ${colorize(effort, color)}`;
}
