---
title: 'Add scoped slots to FormInputTagsSearch for custom item and tag rendering'
project: 'Self Service (Channels)'
milestone: 'M3 — General Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
model: sonnet
mode: claude-code agent
---

## Context

`FormInputTagsSearch` (`app/components/form/input/FormInputTagsSearch.vue`) currently renders each dropdown item and tag pill as plain text (`item.displayName || item.name`). The Additional languages table (issue 005) needs to show a country flag icon alongside language names in both the dropdown items and the selected tag pills. Rather than hardcoding flag logic into the component, the cleanest approach is to expose scoped slots so callers can customise rendering while keeping the default plain-text behaviour.

## Expected Outcome

`FormInputTagsSearch` exposes two new optional scoped slots:
- `#item="{ item: T }"` — used inside `ComboboxItem` to render each dropdown option. Falls back to `{{ item.displayName || item.name }}` when the slot is not provided.
- `#tag="{ item: T }"` — used inside `TagsInputItem` to render each selected tag pill. Falls back to `TagsInputItemText` (current behaviour) when not provided.

The public API (props, emits, `defineModel`) is unchanged. Existing callers that do not provide these slots see identical behaviour to today.

## Implementation Notes

- The component uses `generic="T extends EntityBaseWithName"`, so the slot type parameter `T` is already inferred correctly.
- For the `#item` slot: replace the inner content of `<ComboboxItem>` with:
  ```html
  <slot name="item" :item="getItemById(item._id)">
    {{ item.displayName || item.name }}
  </slot>
  ```
  where `getItemById` returns the full `T` object from `filteredData` by `_id`. (Or pass `item` directly from the `v-for`.)
- For the `#tag` slot: inside `<TagsInputItem>`, the current template renders `<TagsInputItemText />` + `<TagsInputItemDelete />`. Wrap `TagsInputItemText` with the slot:
  ```html
  <slot name="tag" :item="getItemFromDataSet(id)">
    <TagsInputItemText />
  </slot>
  <TagsInputItemDelete />
  ```
  where `getItemFromDataSet(id)` looks up the full `T` object from `dataSet` by `_id`.
- Add a `getItemFromDataSet(id: string): T | undefined` helper inside the script (not exported). This is used to pass the full item object to both slots.
- Do not add flags or any domain-specific logic inside this component — it stays generic. Flag rendering will be done by callers via the slot.
- Ensure the `#tag` slot fallback (`TagsInputItemText`) still works when `displayValue` on `TagsInput` is the `getName` function — i.e. the fallback path must not break the existing plain-text display.

## Acceptance Criteria

- `#item` slot renders custom content in place of the default text when provided; falls back to `{{ item.displayName || item.name }}` when omitted.
- `#tag` slot renders custom content in place of `TagsInputItemText` when provided; falls back to the existing `TagsInputItemText` rendering when omitted.
- All existing usages of `FormInputTagsSearch` in the codebase that do not provide these slots continue to work identically (visual regression test: no change).
- Slot receives the full `T` object (not just the ID) so callers can access any property (e.g. country code for flags).
- `pnpm typecheck` passes — TypeScript correctly infers the slot prop type as `T`.
- `pnpm lint:check` passes with no new errors.
- Vitest: test that providing a custom `#item` slot renders the slot content instead of the default text; test that omitting the slot renders the default.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Scoped slots in a generic Vue component require care with TypeScript inference and slot fallbacks — sonnet handles this confidently without requiring interactive review.
