/**
 * i18n.ts — Internationalization loader
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Try CommonJS-compatible paths
function getI18nDir(): string {
  // When running from dist/, i18n/ is at ../i18n/
  const candidates = [
    join(__dirname, '..', 'i18n'),
    join(__dirname, 'i18n'),
    join(process.cwd(), 'i18n'),
  ];
  for (const p of candidates) {
    try {
      readFileSync(join(p, 'en.json'), 'utf-8');
      return p;
    } catch { /* try next */ }
  }
  return candidates[0];
}

let _cache: Record<string, Record<string, string>> = {};

function loadLang(lang: string): Record<string, string> {
  if (_cache[lang]) return _cache[lang];
  const dir = getI18nDir();
  try {
    const raw = readFileSync(join(dir, `${lang}.json`), 'utf-8');
    _cache[lang] = JSON.parse(raw);
    return _cache[lang];
  } catch {
    // Fallback to English
    if (lang !== 'en') return loadLang('en');
    return {};
  }
}

export function t(key: string, lang: string = 'en'): string {
  const dict = loadLang(lang);
  return dict[key] || key;
}

export function loadI18n(lang: string): Record<string, string> {
  return loadLang(lang);
}
