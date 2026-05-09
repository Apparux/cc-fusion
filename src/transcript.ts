/**
 * transcript.ts — Parse transcript JSONL for tool stats, agents, todos
 */

import { readFileSync, statSync } from 'fs';
import type { ToolStats, TranscriptEntry, TranscriptToolUse } from './types.js';

/**
 * Parse a transcript JSONL file and extract tool usage statistics.
 * Only reads the last N lines for performance (tail-read).
 */
export function parseTranscript(filePath: string | null, maxLines: number = 500): ToolStats {
  const empty: ToolStats = {
    edits: 0,
    reads: 0,
    greps: 0,
    writes: 0,
    bash: 0,
    webFetches: 0,
    totalCalls: 0,
    agents: 0,
    todos: { done: 0, total: 0 },
  };

  if (!filePath) return empty;

  try {
    // Check file exists and size
    const stat = statSync(filePath);
    if (stat.size === 0) return empty;

    // Read file, take last N lines
    const raw = readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n');
    const tail = lines.slice(-maxLines);

    const toolCounts: Record<string, number> = {};
    let lastEditFile: string | undefined;
    let agentCount = 0;
    let todoDone = 0;
    let todoTotal = 0;

    for (const line of tail) {
      if (!line.trim()) continue;
      let entry: TranscriptEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (entry.type === 'tool_use') {
        const tool = entry as TranscriptToolUse;
        const name = (tool.name || '').toLowerCase();
        toolCounts[name] = (toolCounts[name] || 0) + 1;

        // Track last edit file
        if (name === 'edit' || name === 'write') {
          const fp = (tool.input?.file_path || tool.input?.path || '') as string;
          if (fp) lastEditFile = fp;
        }

        // Track agent spawns
        if (name === 'task' || name === 'agent' || name === 'subagent' || name.includes('agent')) {
          agentCount++;
        }
      }

      // Track todos from assistant messages
      if (entry.type === 'assistant' && entry.message?.content) {
        const content = entry.message.content;
        const text = typeof content === 'string' ? content : 
          Array.isArray(content) ? content.map(c => c.text || '').join(' ') : '';
        
        // Count TODO patterns: [x] done, [ ] pending
        const doneMatches = text.match(/\[x\]/gi);
        const pendingMatches = text.match(/\[ \]/g);
        if (doneMatches) todoDone += doneMatches.length;
        if (pendingMatches) todoTotal += pendingMatches.length;
      }
    }

    // Aggregate
    const totalCalls = Object.values(toolCounts).reduce((a, b) => a + b, 0);

    return {
      edits: (toolCounts['edit'] || 0) + (toolCounts['write'] || 0),
      reads: toolCounts['read'] || 0,
      greps: (toolCounts['grep'] || 0) + (toolCounts['glob'] || 0) + (toolCounts['lcm_grep'] || 0),
      writes: toolCounts['write'] || 0,
      bash: toolCounts['bash'] || toolCounts['exec'] || 0,
      webFetches: (toolCounts['webfetch'] || 0) + (toolCounts['web_fetch'] || 0),
      totalCalls,
      lastEditFile,
      agents: agentCount,
      todos: { done: todoDone, total: todoDone + todoTotal },
    };
  } catch {
    return empty;
  }
}

/**
 * Try multiple transcript path patterns.
 */
export function findTranscript(
  sessionId: string | undefined,
  cwd: string | undefined,
  explicitPath: string | null
): string | null {
  if (explicitPath) {
    try {
      statSync(explicitPath);
      return explicitPath;
    } catch {
      return null;
    }
  }

  if (!sessionId || !cwd) return null;

  const home = process.env.HOME || '/root';
  
  // Claude Code patterns — try multiple encodings
  const encoded = cwd.replace(/\//g, '-').replace(/^-/, '');
  const candidates = [
    `${home}/.claude/projects/${encoded}/sessions/${sessionId}/transcript.jsonl`,
    `${home}/.claude/projects/-${encoded}/sessions/${sessionId}/transcript.jsonl`,
  ];

  // Also try with the raw cwd path (some versions use different encoding)
  const rawParts = cwd.split('/').filter(Boolean);
  for (const part of rawParts) {
    candidates.push(
      `${home}/.claude/projects/${part}/sessions/${sessionId}/transcript.jsonl`
    );
  }

  for (const p of candidates) {
    try {
      statSync(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
}
