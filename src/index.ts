#!/usr/bin/env node
/**
 * index.ts — CC-Fusion Statusline Entry Point
 *
 * Reads Claude Code stdin JSON, collects git + transcript data,
 * renders the configured statusline to stdout.
 */

import { closeSync, openSync, readFileSync, readSync, statSync } from 'fs';
import { join } from 'path';
import {
  parseStdin,
  calcContextPct,
  calcUsagePct,
  getTranscriptPath,
  getSessionId,
  getCwd,
  getEffortLevel,
} from './stdin.js';
import { findTranscript, parseTranscript } from './transcript.js';
import { getGitInfo } from './git.js';
import { getProjectDir, loadConfig, loadTheme, loadPreset, readConfigFile } from './config.js';
import { runConfigureCommand } from './configure.js';
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

function readTranscriptEdgeLines(transcriptPath: string): [string, string] | null {
  const stat = statSync(transcriptPath);
  if (stat.size === 0) return null;

  const chunkSize = Math.min(stat.size, 8192);
  const firstBuffer = Buffer.alloc(chunkSize);
  const lastBuffer = Buffer.alloc(chunkSize);
  const fd = openSync(transcriptPath, 'r');
  try {
    readSync(fd, firstBuffer, 0, chunkSize, 0);
    readSync(fd, lastBuffer, 0, chunkSize, stat.size - chunkSize);
  } finally {
    closeSync(fd);
  }

  const firstLine = firstBuffer.toString('utf-8').split('\n').find(line => line.trim());
  const lastLine = lastBuffer.toString('utf-8').trim().split('\n').filter(Boolean).pop();
  return firstLine && lastLine ? [firstLine, lastLine] : null;
}

function estimateDuration(transcriptPath: string | null): string {
  if (!transcriptPath) return '';
  try {
    const edgeLines = readTranscriptEdgeLines(transcriptPath);
    if (!edgeLines) return '';

    const first = JSON.parse(edgeLines[0]);
    const last = JSON.parse(edgeLines[1]);

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

// ── CLI commands ─────────────────────────────────────────────────────────────

function printHelp(): void {
  process.stdout.write(`Usage:
  cc-fusion              Render statusline from Claude Code stdin
  cc-fusion configure    Run guided configuration
  cc-fusion config       Alias for configure
  cc-fusion init         Alias for configure
  cc-fusion --help       Show this help
  cc-fusion --version    Show version
`);
}

function readPackageVersion(): string {
  const pkg = readConfigFile(join(getProjectDir(), 'package.json'));
  return typeof pkg?.version === 'string' ? pkg.version : 'unknown';
}

async function handleCliCommand(command: string | undefined): Promise<boolean> {
  if (!command) return false;

  if (command === 'configure' || command === 'config' || command === 'init') {
    await runConfigureCommand();
    return true;
  }

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return true;
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    process.stdout.write(`${readPackageVersion()}\n`);
    return true;
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printHelp();
  process.exitCode = 1;
  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (await handleCliCommand(process.argv[2])) return;

  // 1. Load config, theme, preset, i18n
  const config = loadConfig();
  const theme = loadTheme(config.theme);
  const preset = loadPreset(config.preset);
  const i18n = loadI18n(config.lang);

  // 2. Parse stdin JSON
  const rawStdin = readStdin();
  const stdin = parseStdin(rawStdin);

  const cwd = getCwd(stdin);
  const sessionId = getSessionId(stdin);

  // 3. Collect git info
  const git = getGitInfo(cwd);

  // 4. Find and parse transcript
  const transcriptPath = config.showTranscript
    ? findTranscript(sessionId, cwd, getTranscriptPath(stdin))
    : null;
  const tools = parseTranscript(transcriptPath);

  // 5. Build render context
  const model = simplifyModel(
    stdin.model?.display_name,
    stdin.model?.id
  );
  const dir = shortenDir(cwd, process.env.HOME);
  const contextPct = calcContextPct(stdin);
  const usagePct = calcUsagePct(stdin);
  const costUsd = stdin.cost?.total_cost_usd ?? null;
  const duration = estimateDuration(transcriptPath);
  const effort = getEffortLevel(stdin) || '';

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

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`cc-fusion failed: ${message}\n`);
  process.exitCode = 1;
});
