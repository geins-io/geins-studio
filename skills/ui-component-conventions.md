# UI component conventions (shadcn-vue + app components)

Goal: Add/modify UI components in a way that matches project conventions and avoids drift.

See also:

- CLAUDE.md → “Stack” (shadcn-vue policy)
- CLAUDE.md → “Component UI Patterns - Component Conventions”
- CLAUDE.md → “Code Conventions” (imports, auto-imports)

## Rules

- shadcn-vue primitives are installed via CLI; do not create them manually.
- Component filenames must include the full directory path prefix (filename becomes the component name).

## Common patterns to follow

- Prefer existing card/panel patterns (ContentEditCard, sheet-based panels, etc.) when building edit UIs.
- For read-only cards: use the consistent labeled-value styling pattern described in CLAUDE.md.

## Verify

- Component auto-import name matches what you expect.
- Lint/typecheck succeed.
