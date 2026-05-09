#!/usr/bin/env node
/**
 * index.ts — CC-Fusion Statusline Entry Point
 *
 * Reads Claude Code stdin JSON, collects git + transcript data,
 * renders the 3-line statusline to stdout.
 */

import { readFileSync } from 'fs';
import { parseStdin, calcContextPct, getTranscriptPath } from './stdin.js';
import { findTranscript, parseTranscript } from './transcript.js';
import { getGitInfo } from './git.js';
import { loadConfig, loadTheme, loadPreset } from './config.js';
import { loadI18n } from './i18n.js';
import { simplifyModel, shortenDir, formatDuration } from './utils.js';
import { render } from './render.js';
import type { RenderContext, StdinData } from './types.js';

// ── Read stdin ───────────────────────────────────────────────────────────────

function readStdin(): string {
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    return '{}';
  }
}

// ── Session duration estimation ──────────────────────────────────────────────

function estimateDuration(transcriptPath: string | null): string {
  if (!transcriptPath) return '';
  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    const lines = raw.trim().split('\n');
    if (lines.length < 2) return '';

    // Parse first and last timestamps
    const first = JSON.parse(lines[0]);
    const last = JSON.parse(lines[lines.length - 1]);

    const t1 = first.timestamp || first.ts || first.created_at;
    const t2 = last.timestamp || last.ts || last.created_at;

    if (t1 && t2) {
      const d1 = new Date(t1).getTime();
      const d2 = new Date(t2).getTime();
      if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
        return formatDuration(d2 - d1);
      }
    }
  } catch { /* ignore */ }
  return '';
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  // 1. Load config, theme, preset, i18n
  const config = loadConfig();
  const theme = loadTheme(config.theme);
  const preset = loadPreset(config.preset);
  const i18n = loadI18n(config.lang);

  // 2. Parse stdin JSON
  const rawStdin = readStdin();
  const stdin = parseStdin(rawStdin);

  // 3. Collect git info
  const git = getGitInfo(stdin.cwd);

  // 4. Find and parse transcript
  const transcriptPath = config.showTranscript
    ? findTranscript(stdin.sessionId, stdin.cwd, getTranscriptPath(stdin))
    : null;
  const tools = parseTranscript(transcriptPath);

  // 5. Build render context
  const model = simplifyModel(
    stdin.model?.display_name,
    stdin.model?.id
  );
  const dir = shortenDir(stdin.cwd, process.env.HOME);
  const contextPct = calcContextPct(stdin);
  const usagePct = contextPct; // Same base; layered logic in render
  const costUsd = stdin.cost?.total_cost_usd ?? null;
  const duration = estimateDuration(transcriptPath);
  const effort = stdin.effortLevel || '';

  const rc: RenderContext = {
    stdin,
    git,
    tools,
    theme,
    preset,
    config,
    i18n,
    model,
    dir,
    contextPct,
    usagePct,
    costUsd,
    duration,
    effort,
  };

  // 6. Render and output
  const output = render(rc);
  if (output) {
    process.stdout.write(output + '\n');
  }
}

main();
