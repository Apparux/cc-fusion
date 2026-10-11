# Domain Docs

## Layout

Single-context repository:

- `GLOSSARY.md` at the repository root.
- Architecture decision records under `docs/adr/`.

## Before exploring, read these

Read the root `GLOSSARY.md` and the ADRs relevant to the area being explored.

If these files do not exist, proceed silently. Do not flag their absence
or suggest creating them upfront. The `domain-modeling` skill creates
them lazily when terminology or architectural decisions are resolved.

## Use the glossary's vocabulary

When naming a domain concept in an issue, proposal, hypothesis, or test,
use the term defined in `GLOSSARY.md`. Do not drift to synonyms the glossary
explicitly avoids.

If a concept is missing, reconsider whether it belongs to the project,
or note the gap for `domain-modeling`.

## Flag ADR conflicts

Surface conflicts with an existing ADR explicitly rather than silently
overriding the recorded decision.
