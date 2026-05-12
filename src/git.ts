/**
 * git.ts — Git info collection via child_process
 */

import { execSync } from 'child_process';
import type { GitInfo } from './types.js';

function exec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

export function getGitInfo(cwd: string | undefined): GitInfo | null {
  if (!cwd) return null;

  // Check if in a git repo
  const isGit = exec('git rev-parse --is-inside-work-tree', cwd);
  if (isGit !== 'true') return null;

  const branch = exec('git rev-parse --abbrev-ref HEAD', cwd) || 'detached';
  const dirtyFlag = exec('git status --porcelain', cwd);
  const dirty = dirtyFlag.length > 0;

  return { branch, dirty };
}
