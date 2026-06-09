---
name: geins-i18n-update
description: "Make translation changes safely and consistently in Geins Studio. Always update both en.json and sv.json locale files. Use when adding, updating, or modifying i18n keys, translations, or locale strings. Trigger on: i18n, translation, locale, en.json, sv.json, add translation, update translation, internationalization."
---

# Geins Studio — i18n Update

Make translation changes safely and consistently. See `CLAUDE.md` → "Stack" (i18n rules) for the canonical reference.

## Rules

- **No hardcoded UI strings (HARD RULE).** Every user-facing string — labels, buttons, headings, menu/nav items, placeholders, `title=`, tooltips, empty states, toast titles/descriptions, dialog copy — MUST be an i18n key resolved via `$t`/`t`. Never write the English text straight into a `.vue` template or script. The only raw text allowed is dynamic data from the API. If you add UI copy, you add a key to BOTH locale files.
- **Sentence case (HARD RULE).** All i18n values (and any UI string) use sentence case: capitalize only the first word and proper nouns — NOT Title Case.
  - ✅ `"Total workflows"`, `"Integration kits"`, `"New workflow"`, `"Older execution of this workflow"`
  - ❌ `"Total Workflows"`, `"Integration Kits"`, `"New Workflow"`
  - Exceptions: pluralized entity-name keys keep their natural case (`"workflow": "Workflow | Workflows"`); proper nouns/acronyms stay capitalized (`SKU`, `VAT`, `Geins`).
- **Reuse before adding.** Prefer an existing key (incl. pluralization, e.g. `$t('workflow', 2)` → "Workflows") over a new namespaced duplicate.
- **Always** update BOTH locale files in the same change:
  - `i18n/locales/en.json`
  - `i18n/locales/sv.json`
- Global entity action keys (top-level, outside any namespace): `save_entity`, `delete_entity`, `send_entity`, `accept_entity`, `reject_entity`, `confirm_entity`, `cancel_entity` — all use `@.lower:{entityName}` interpolation and serve as both button labels and dialog titles.
- Quotation-specific description text belongs in the `orders` namespace (for example `orders.accept_quotation_description`).

## Checklist

1. Add or update keys in `en.json`.
2. Mirror the same keys in `sv.json`.
3. Search usages to ensure the key naming matches conventions already in the codebase.
4. Verify every new English value is **sentence case** (only first word + proper nouns capitalized).
5. Scan your `.vue` diff for raw user-facing text (labels, headings, `title=`, `placeholder=`, toast strings) that should be an i18n key instead.

## Verify

- Start dev server and navigate to the relevant UI.
- Toggle locale (if supported) or sanity-check at least English and Swedish paths.
- Run `pnpm lint:check` and `pnpm typecheck` when code usage changed alongside the locale keys.
- Run `pnpm test --run` when tests exist for the changed code.
