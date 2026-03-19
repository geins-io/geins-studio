---
name: geins-i18n-update
description: "Make translation changes safely and consistently in Geins Studio. Always update both en.json and sv.json locale files. Use when adding, updating, or modifying i18n keys, translations, or locale strings. Trigger on: i18n, translation, locale, en.json, sv.json, add translation, update translation, internationalization."
---

# Geins Studio — i18n Update

Make translation changes safely and consistently. See `CLAUDE.md` → "Stack" (i18n rules) for the canonical reference.

## Rules

- **Always** update BOTH locale files in the same change:
  - `i18n/locales/en.json`
  - `i18n/locales/sv.json`
- Global entity action keys (top-level, outside any namespace): `save_entity`, `delete_entity`, `send_entity`, `accept_entity`, `reject_entity`, `confirm_entity`, `cancel_entity` — all use `@.lower:{entityName}` interpolation.

## Checklist

1. Add or update keys in `en.json`.
2. Mirror the same keys in `sv.json`.
3. Search usages to ensure the key naming matches conventions already in the codebase.

## Verify

- Start dev server and navigate to the relevant UI.
- Toggle locale (if supported) or sanity-check at least English and Swedish paths.
