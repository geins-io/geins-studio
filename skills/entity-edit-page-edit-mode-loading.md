# Entity edit page: required edit-mode data loading

Goal: Ensure edit pages always load data correctly in edit mode, and that unsaved-changes behaves correctly.

See also:

- CLAUDE.md → “Page Patterns - Entity Edit Page”
- CLAUDE.md → “Entity Edit Page - Edit Mode Data Loading required boilerplate”

## Non-negotiable

Every `[id].vue` entity page MUST include the edit-mode loading block described in CLAUDE.md.
Without it, navigating to an existing entity (or returning after create) can show an empty form.

## Required structure (conceptual)

- Use `useAsyncData` keyed by the entity fetch key.
- On mounted:
  - Fetch result → validate using the standard error handler
  - `parseAndSaveData(entity)` to reshape + set form values

## Common gotchas (apply as needed)

- If `parseEntityData` depends on other data (lists, lookups), fetch those first, then parse.
- Unsaved-changes snapshot timing:
  - If parsing triggers async side effects that mutate update data, skip automatic snapshot,
    await the async work, then snapshot after `nextTick`.
- `onFormValuesChange` must map ALL update-relevant fields or the Save button may not enable.
- If fields unmount in “sent/read-only mode”, VeeValidate may clear values and trigger a wipe;
  guard `onFormValuesChange` in that mode and read display data from reshaped response data instead.

## Verify

- Create mode: create entity → confirm auto-navigate to edit URL works.
- Edit mode: refresh page on an existing entity → data is populated.
- Unsaved changes indicator: doesn’t flicker during initial load, enables on changes.
