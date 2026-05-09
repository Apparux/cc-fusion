"use strict";
/**
 * i18n.ts — Internationalization loader
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = t;
exports.loadI18n = loadI18n;
const fs_1 = require("fs");
const path_1 = require("path");
// Try CommonJS-compatible paths
function getI18nDir() {
    // When running from dist/, i18n/ is at ../i18n/
    const candidates = [
        (0, path_1.join)(__dirname, '..', 'i18n'),
        (0, path_1.join)(__dirname, 'i18n'),
        (0, path_1.join)(process.cwd(), 'i18n'),
    ];
    for (const p of candidates) {
        try {
            (0, fs_1.readFileSync)((0, path_1.join)(p, 'en.json'), 'utf-8');
            return p;
        }
        catch { /* try next */ }
    }
    return candidates[0];
}
let _cache = {};
function loadLang(lang) {
    if (_cache[lang])
        return _cache[lang];
    const dir = getI18nDir();
    try {
        const raw = (0, fs_1.readFileSync)((0, path_1.join)(dir, `${lang}.json`), 'utf-8');
        _cache[lang] = JSON.parse(raw);
        return _cache[lang];
    }
    catch {
        // Fallback to English
        if (lang !== 'en')
            return loadLang('en');
        return {};
    }
}
function t(key, lang = 'en') {
    const dict = loadLang(lang);
    return dict[key] || key;
}
function loadI18n(lang) {
    return loadLang(lang);
}
//# sourceMappingURL=i18n.js.map