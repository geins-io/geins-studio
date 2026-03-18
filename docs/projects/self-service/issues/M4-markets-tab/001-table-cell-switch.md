---
title: 'Create TableCellSwitch reusable table cell component'
project: 'Self Service (Channels)'
milestone: 'M4 — Markets Tab'
priority: 2
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: haiku
mode: claude-code agent
---

## Context

The Markets tab requires an inline toggle switch inside table rows to activate/deactivate individual markets. The project plan explicitly calls this out as a new reusable component (`TableCellSwitch`) that emits a change event with the new value — applicable to any table that needs a boolean toggle cell.

## Expected Outcome

A new `app/components/table/cell/TableCellSwitch.vue` component that:
- Renders a shadcn-vue `Switch` centered in a table cell
- Accepts `value: boolean` (current state) and `onChange: (value: boolean) => void` as props
- Calls `onChange` with the new boolean when toggled
- Accepts an optional `disabled?: boolean` prop forwarded to the `Switch`
- Is reusable with no market-specific logic

## Implementation Notes

- Location: `app/components/table/cell/TableCellSwitch.vue` — follows the pattern of `TableCellProduct` and `TableCellActions` in the same directory.
- Auto-imported name matches the filename: `TableCellSwitch`.
- Props:
  ```ts
  defineProps<{
    value: boolean
    onChange: (value: boolean) => void
    disabled?: boolean
  }>()
  ```
- Use the shadcn-vue `Switch` from `app/components/ui/switch/`. Pass `:checked="value"`, `@update:checked="onChange"`, `:disabled="disabled"`.
- Cell wrapper: `<div class="flex items-center">` — no extra padding beyond what the table row provides.
- No i18n needed — pure UI toggle.
- When used in `h()` render functions inside `useColumns`, pass typed props: `h(TableCellSwitch, { value: row.active, onChange: (v) => handleToggle(row, v) })`.

## Acceptance Criteria

- `TableCellSwitch` renders a `Switch` with the correct checked state matching the `value` prop.
- Toggling the switch calls `onChange` with `true` when turned on and `false` when turned off.
- `disabled` prop prevents toggling and visually disables the switch.
- Component contains no market-specific logic — it works with any boolean field.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: test that `onChange` is called with `true` when toggled on; test that `onChange` is called with `false` when toggled off; test that `disabled` prevents `onChange` from firing.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Single-file component following an existing, well-defined pattern with clear bounded scope — trivial for haiku.
