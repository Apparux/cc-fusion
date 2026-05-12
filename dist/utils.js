/**
 * utils.ts — Utility functions for statusline rendering
 */
/**
 * Render a progress bar with filled and empty blocks
 */
export function renderProgressBar(pct, width = 10) {
    const filled = Math.round((pct / 100) * width);
    const empty = width - filled;
    return '▓'.repeat(filled) + '▒'.repeat(empty);
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