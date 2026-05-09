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

  // Count staged, unstaged, untracked
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;
  if (dirtyFlag) {
    for (const line of dirtyFlag.split('\n')) {
      if (!line.trim()) continue;
      const x = line[0]; // index status
      const y = line[1]; // worktree status
      if (x === '?' && y === '?') {
        untracked++;
      } else {
        if (x !== ' ' && x !== '?') staged++;
        if (y !== ' ' && y !== '?') unstaged++;
      }
    }
  }

  // Ahead/behind tracking
  let ahead = 0;
  let behind = 0;
  const upstream = exec('git rev-parse --abbrev-ref @{upstream}', cwd);
  if (upstream) {
    const counts = exec('git rev-list --left-right --count HEAD...@{upstream}', cwd);
    if (counts) {
      const parts = counts.split(/\s+/);
      ahead = parseInt(parts[0] || '0', 10) || 0;
      behind = parseInt(parts[1] || '0', 10) || 0;
    }
  }

  return { branch, dirty, ahead, behind, staged, unstaged, untracked };
}
