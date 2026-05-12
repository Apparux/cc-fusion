# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

This project has no database, ORM, migrations, API server, or persistent application datastore. It is a TypeScript CLI that reads stdin, local config files, theme/preset assets, git state, and Claude transcript JSONL files.

Agents must not invent database layers, migrations, repositories, or query abstractions for this repo.

---

## Data Sources Used Instead

The real data sources are file- and process-based:

- Config files loaded by `src/config.ts`:
  - built-in `config.json` when present in the package root
  - project `cc-fusion.config.json` from `process.cwd()`
  - user `~/.claude/cc-fusion/config.json`
  - explicit `CC_FUSION_CONFIG`
- Theme TOML files loaded by `loadTheme` from `themes/` or `~/.claude/cc-fusion/themes/`.
- Preset JSON files loaded by `loadPreset` from `presets/` or `~/.claude/cc-fusion/presets/`.
- Claude Code stdin JSON normalized by helpers in `src/stdin.ts`.
- Transcript JSONL tail parsing in `src/transcript.ts`.
- Git status queried by `src/git.ts` through short-timeout child processes.

---

## Persistence Patterns

- Runtime configuration writes happen only in the guided flow in `src/configure.ts`, which creates `~/.claude/cc-fusion/` and writes `config.json` with `JSON.stringify(nextConfig, null, 2)`.
- Built assets under `themes/`, `presets/`, and `i18n/` are static package files. Keep them human-editable and stable.
- Do not store user/session data in the repository. Transcript and user config paths are under `~/.claude/`.

---

## Migrations

There are no schema migrations. For config shape changes, preserve backward compatibility through merge/default logic in `src/config.ts` and compatibility helpers in `src/stdin.ts` where applicable.

---

## Common Mistakes

- Do not add an ORM, SQLite dependency, migration runner, or repository pattern unless the product requirements explicitly introduce durable app storage.
- Do not treat transcript JSONL as a database. `src/transcript.ts` intentionally tail-reads bounded bytes/lines and tolerates malformed lines.
- Do not write generated or user-specific state into `dist/`, `.claude/`, or other local harness files inside the repo.
