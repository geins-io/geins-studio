# Table patterns (TanStack Table + TableView)

Goal: Implement tables consistent with project modes (Advanced/Simple/Minimal) and reuse existing helpers.

See also:

- CLAUDE.md → “Component UI Patterns - Table Patterns”

## Rules

- Table modes are defined by `TableMode` (Advanced, Simple, Minimal).
- Minimal mode has specific UI constraints (no pagination/sorting/borders; plain headers).

## Checklist

1. Prefer `useColumns.getColumns` with:

- `sortable: false` as needed
- `includeColumns`
- `columnTypes` (editable-\* types, currency, product, etc.)

2. Actions column

- Default actions: edit, copy, delete
- Enable copy by adding `copy` and providing an `onCopy` handler that:
  - calls copy endpoint
  - shows toast
  - navigates to new entity URL

3. Minimal mode styling

- Don’t modify UI primitives to achieve mode styling; follow the TableView mode override approach.

## Verify

- Minimal mode renders without extra table chrome.
- Inline edits work (onChange/onBlur patterns).
