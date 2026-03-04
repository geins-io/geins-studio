# i18n update

Goal: Make translation changes safely and consistently.

See also:

- CLAUDE.md → “Geins Studio - Stack” (i18n rules)
- CLAUDE.md → “Project Structure” (i18n files)

## Rules

- Always update BOTH locale files:
  - `i18n/locales/en.json`
  - `i18n/locales/sv.json`

## Checklist

1. Add or update keys in `en.json`.
2. Mirror the same keys in `sv.json`.
3. Search usages to ensure the key naming matches conventions already in the codebase.

## Verify

- Start dev server and navigate to the relevant UI.
- Toggle locale (if supported in the app) or sanity check at least English + Swedish paths.
