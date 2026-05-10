/**
 * config.ts — Config loading (JSON + TOML theme)
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Config, Theme, ThemeColors, ThemeIcons, Preset } from './types.js';
import { ANSI } from './utils.js';

// ── Inline TOML parser (simple, no external deps) ────────────────────────────

function parseToml(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentSection: Record<string, unknown> = result;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header: [section] or [section.subsection]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      const keys = sectionMatch[1].split('.').map(k => k.trim());
      let target = result;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
          target[keys[i]] = {};
        }
        target = target[keys[i]] as Record<string, unknown>;
      }
      const lastKey = keys[keys.length - 1];
      if (!target[lastKey] || typeof target[lastKey] !== 'object') {
        target[lastKey] = {};
      }
      currentSection = target[lastKey] as Record<string, unknown>;
      continue;
    }

    // Key-value: key = "value" or key = 'value'
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value: string = kvMatch[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Process escape sequences in double-quoted strings
      if (kvMatch[2].trim().startsWith('"')) {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
      }

      currentSection[key] = value;
    }
  }

  return result;
}

// ── File discovery ───────────────────────────────────────────────────────────

export function getProjectDir(): string {
  const candidates = [
    join(__dirname, '..'),
    join(__dirname, '..', '..'),
    process.cwd(),
  ];
  for (const p of candidates) {
    try {
      readFileSync(join(p, 'package.json'), 'utf-8');
      return p;
    } catch { /* try next */ }
  }
  return candidates[0];
}

export function getUserConfigDir(): string {
  return join(process.env.HOME || '/root', '.claude', 'cc-fusion');
}

export function getUserConfigPath(): string {
  return join(getUserConfigDir(), 'config.json');
}

export function readConfigFile(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function mergeConfig(base: Config, override: Record<string, unknown> | null): Config {
  if (!override) return base;
  const merged: Config = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key === 'hideCostFor') {
      if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
        merged.hideCostFor = value;
      }
    } else if (key === 'elements') {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const elements = Object.fromEntries(
          Object.entries(value).filter(([, enabled]) => typeof enabled === 'boolean')
        ) as Record<string, boolean>;
        merged.elements = { ...(merged.elements || {}), ...elements };
      }
    } else if (['usageThreshold', 'tokenBreakdownThreshold', 'barWidth'].includes(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        (merged as unknown as Record<string, number>)[key] = value;
      }
    } else if (key in merged) {
      (merged as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

function firstExisting(paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(path)) return path;
  }
  return null;
}

// ── Default config ───────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: Config = {
  theme: 'cometix',
  preset: 'full',
  lang: 'en',
  hideCostFor: ['bedrock', 'vertex'],
  usageThreshold: 80,
  tokenBreakdownThreshold: 85,
  barWidth: 20,
  showTranscript: true,
};

export function loadConfig(): Config {
  const projectDir = getProjectDir();
  const configPaths = [
    join(projectDir, 'config.json'),
    join(process.cwd(), 'cc-fusion.config.json'),
    join(getUserConfigDir(), 'config.json'),
  ];

  let config = { ...DEFAULT_CONFIG };
  for (const path of configPaths) {
    config = mergeConfig(config, readConfigFile(path));
  }

  if (process.env.CC_FUSION_CONFIG) {
    config = mergeConfig(config, readConfigFile(process.env.CC_FUSION_CONFIG));
  }

  return config;
}

// ── Theme loading ────────────────────────────────────────────────────────────

const DEFAULT_THEME_COLORS: ThemeColors = {
  reset: ANSI.reset,
  bold: ANSI.bold,
  dim: ANSI.dim,
  red: ANSI.red,
  green: ANSI.green,
  yellow: ANSI.yellow,
  blue: ANSI.blue,
  magenta: ANSI.magenta,
  cyan: ANSI.cyan,
  white: ANSI.white,
  brightBlue: ANSI.brightBlue,
  brightMagenta: ANSI.brightMagenta,
  orange: ANSI.orange,
  gold: ANSI.gold,
  modelColor: ANSI.cyan,
  dirColor: ANSI.blue,
  gitColor: ANSI.green,
  contextColor: ANSI.cyan,
  usageColor: ANSI.blue,
  costColor: ANSI.gold,
  effortColor: ANSI.yellow,
  toolColor: ANSI.magenta,
  agentColor: ANSI.brightMagenta,
  todoColor: ANSI.green,
  separatorColor: ANSI.dim,
  barFill: ANSI.cyan,
  barEmpty: ANSI.dim,
};

const DEFAULT_THEME_ICONS: ThemeIcons = {
  model: '◈',
  git: '⎇',
  gitDirty: '✱',
  dir: '⌂',
  effort: '↯',
  tool: '◐',
  grep: '⌕',
  read: '⊙',
  write: '✎',
  bash: '›_',
  agent: '⊕',
  todo: '☐',
  todoDone: '☑',
  cost: '◆',
  clock: '◷',
  context: '◈',
  usage: '▦',
  web: '⊕',
  separator: '│',
};

// ANSI code mapping for theme TOML values
const ANSI_MAP: Record<string, string> = {
  reset: ANSI.reset,
  bold: ANSI.bold,
  dim: ANSI.dim,
  red: ANSI.red,
  green: ANSI.green,
  yellow: ANSI.yellow,
  blue: ANSI.blue,
  magenta: ANSI.magenta,
  cyan: ANSI.cyan,
  white: ANSI.white,
  brightblue: ANSI.brightBlue,
  brightmagenta: ANSI.brightMagenta,
  orange: ANSI.orange,
  gold: ANSI.gold,
};

function resolveColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const mapped = ANSI_MAP[value.toLowerCase()];
  if (mapped) return mapped;
  return value;
}

export function loadTheme(name: string): Theme {
  const projectDir = getProjectDir();
  const themePath = firstExisting([
    join(getUserConfigDir(), 'themes', `${name}.toml`),
    join(projectDir, 'themes', `${name}.toml`),
  ]);

  try {
    if (!themePath) throw new Error('theme not found');
    const raw = readFileSync(themePath, 'utf-8');
    const parsed = parseToml(raw);

    const colorsSection = (parsed.colors || {}) as Record<string, unknown>;
    const iconsSection = (parsed.icons || {}) as Record<string, unknown>;

    const colors: ThemeColors = { ...DEFAULT_THEME_COLORS };
    for (const [key, val] of Object.entries(colorsSection)) {
      if (typeof val === 'string' && key in colors) {
        (colors as unknown as Record<string, string>)[key] = resolveColor(val, (colors as unknown as Record<string, string>)[key]);
      }
    }

    const icons: ThemeIcons = { ...DEFAULT_THEME_ICONS };
    for (const [key, val] of Object.entries(iconsSection)) {
      if (typeof val === 'string' && key in icons) {
        (icons as unknown as Record<string, string>)[key] = val;
      }
    }

    return { name, colors, icons };
  } catch {
    return {
      name: 'default',
      colors: { ...DEFAULT_THEME_COLORS },
      icons: { ...DEFAULT_THEME_ICONS },
    };
  }
}

// ── Preset loading ───────────────────────────────────────────────────────────

const PRESETS: Record<string, Preset> = {
  full: {
    name: 'full',
    lines: [
      ['model', 'dir', 'git'],
      ['context', 'usage', 'cost', 'duration', 'effort'],
      ['tools', 'agents', 'todos'],
    ],
  },
  essential: {
    name: 'essential',
    lines: [
      ['model', 'git'],
      ['context', 'usage', 'cost'],
    ],
  },
  minimal: {
    name: 'minimal',
    lines: [
      ['model', 'context'],
    ],
  },
};

export function loadPreset(name: string): Preset {
  const projectDir = getProjectDir();
  const presetPath = firstExisting([
    join(getUserConfigDir(), 'presets', `${name}.json`),
    join(projectDir, 'presets', `${name}.json`),
  ]);

  try {
    if (!presetPath) throw new Error('preset not found');
    return JSON.parse(readFileSync(presetPath, 'utf-8')) as Preset;
  } catch {
    return PRESETS[name] || PRESETS.full;
  }
}
