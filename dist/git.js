/**
 * git.ts — Git info collection via child_process
 */
import { execFileSync } from 'child_process';
export function getGitInfo(cwd) {
    if (!cwd)
        return null;
    let executable = 'git';
    function exec(args) {
        try {
            return execFileSync(executable, args, {
                cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'],
            }).trim();
        }
        catch (error) {
            const { code } = error;
            // An old Intel Git can shadow the working system Git on Apple Silicon.
            if (process.platform === 'darwin' && executable === 'git'
                && ['ENOENT', 'EACCES', 'Unknown system error -86'].includes(code ?? '')) {
                executable = '/usr/bin/git';
                return exec(args);
            }
            return '';
        }
    }
    // Check if in a git repo
    const isGit = exec(['rev-parse', '--is-inside-work-tree']);
    if (isGit !== 'true')
        return null;
    const branch = exec(['rev-parse', '--abbrev-ref', 'HEAD']) || 'detached';
    const dirtyFlag = exec(['status', '--porcelain']);
    const dirty = dirtyFlag.length > 0;
    return { branch, dirty };
}
//# sourceMappingURL=git.js.map