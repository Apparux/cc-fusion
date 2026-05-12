/**
 * git.ts — Git info collection via child_process
 */
import { execSync } from 'child_process';
function exec(cmd, cwd) {
    try {
        return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    }
    catch {
        return '';
    }
}
export function getGitInfo(cwd) {
    if (!cwd)
        return null;
    // Check if in a git repo
    const isGit = exec('git rev-parse --is-inside-work-tree', cwd);
    if (isGit !== 'true')
        return null;
    const branch = exec('git rev-parse --abbrev-ref HEAD', cwd) || 'detached';
    const dirtyFlag = exec('git status --porcelain', cwd);
    const dirty = dirtyFlag.length > 0;
    return { branch, dirty };
}
//# sourceMappingURL=git.js.map