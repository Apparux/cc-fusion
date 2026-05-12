/**
 * utils.ts — Utility functions for statusline rendering
 */
import { COLORS } from './colors.js';
/**
 * Render a progress bar with filled and empty blocks
 * Returns { filled, empty } for separate coloring
 */
export function renderProgressBar(pct, width = 10) {
    const filledCount = Math.round((pct / 100) * width);
    const emptyCount = width - filledCount;
    return {
        filled: '▰'.repeat(filledCount),
        empty: '▱'.repeat(emptyCount),
    };
}
/**
 * Get traffic-light color based on percentage
 */
export function progressColor(pct) {
    if (pct >= 80)
        return COLORS.red;
    if (pct >= 50)
        return COLORS.yellow;
    return COLORS.green;
}
/**
 * Format token count with k/M suffix
 */
export function formatTokens(tokens) {
    if (tokens >= 1000000) {
        return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
}
/**
 * Simplify model name for display
 */
export function simplifyModel(displayName, id) {
    const name = displayName || id || 'Unknown';
    if (name.includes('Opus'))
        return 'Opus 4';
    if (name.includes('Sonnet'))
        return 'Sonnet 4';
    if (name.includes('Haiku'))
        return 'Haiku 4';
    return name;
}
/**
 * Get project name from cwd
 */
export function getProjectName(cwd) {
    if (!cwd)
        return 'Unknown';
    const parts = cwd.split('/');
    return parts[parts.length - 1] || 'Unknown';
}
/**
 * Shorten file path for display
 */
export function shortenPath(path) {
    const parts = path.split('/');
    if (parts.length <= 2)
        return path;
    return parts.slice(-2).join('/');
}
//# sourceMappingURL=utils.js.map