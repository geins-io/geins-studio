---
name: geins-entity-edit-page
description: "Guides correct implementation of entity edit pages ([id].vue) in the Geins Studio codebase. Use this skill whenever working on any [id].vue page in geins-studio — including creating new entity pages, fixing edit-mode loading, debugging why the save button doesn't enable, handling unsaved-changes detection, implementing status transitions, or understanding the useEntityEdit/parseEntityData/onFormValuesChange pattern. Trigger on: edit page, create mode, edit mode, [id].vue, useEntityEdit, parseEntityData, onFormValuesChange, save button, unsaved changes, snapshot timing, sent mode, entity form."
---

# Geins Studio — Entity Edit Page

Entity pages are single `[id].vue` files that handle both create (`id === 'new'`) and edit (real ID) mode via the `useEntityEdit` composable.

Read `CLAUDE.md` → "Page Patterns - Entity Edit Page" for the full reference. This skill gives you the critical patterns and gotchas so you don't have to scan the whole file.

## Before writing code

- If this work comes from a Linear issue, set the issue to `In Progress` before writing code.
- Ask whether to keep working on the current branch or create a new one.
- If creating a branch, base it on `next` and use `feat/{linear-issue-number}-{short-description}` or `fix/{linear-issue-number}-{short-description}`.
- Read the issue against `CLAUDE.md` and this skill first. If the issue is missing codebase-specific implementation detail, update it before writing the page.

## Orientation

`useEntityEdit` provides:
- `form` — VeeValidate form instance
- `entityData` / `entityDataUpdate` — response data and update payload refs
- `createMode` — `ref<boolean>`, set once at component creation from `route.params.id`
- `createEntity()` / `updateEntity()` / `deleteEntity()`
- `hasUnsavedChanges`, `confirmLeave`
- `parseAndSaveData(entity, snapshot?)` — reshapes API response → sets form values + snapshot
- `setOriginalSavedData()` — manually captures the current state as the "clean" baseline
- `refreshEntityData` — ref you assign a `refresh` function to, for triggering re-fetches
- `entityFetchKey` — computed unique key for `useAsyncData`

Key callbacks you implement:
- `parseEntityData(entity)` — map API response fields into form values
- `prepareCreateData()` / `prepareUpdateData()` — map form → POST/PATCH body
- `onFormValuesChange(values)` — keep `entityDataUpdate` in sync as the form changes

## Required edit-mode loading block

Every `[id].vue` **must** include this block at the bottom of `<script setup>`. Without it, reloading on an existing entity or returning after creation shows a blank form.

```ts
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<TResponse>(
    entityFetchKey.value,
    () => repository.get(entityId.value, { fields: ['all'] }),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<TResponse>(error.value, data.value);
    await parseAndSaveData(entity);
  });
}
```

- `useAsyncData` runs at setup time; `onMounted` fires after the component is in the DOM
- `handleFetchResult` throws a page error on 404/500 — no extra null-checking needed
- After creation, `useEntityEdit` navigates to the edit URL via `router.replace()`, which re-mounts the component and triggers this block automatically

## Gotcha: snapshot timing

If `parseEntityData` triggers async side effects that mutate `entityDataUpdate` (e.g. `form.setValues()` → `onFormValuesChange` → reactive watchers → async fetches like `fetchProducts()`), the default snapshot taken inside `parseAndSaveData` will be stale. Fix:

```ts
// In onMounted:
await parseAndSaveData(entity, false)   // skip automatic snapshot
await fetchSomethingAsync()             // await all async side effects
await nextTick()
setOriginalSavedData()                  // capture the settled state
```

Apply the same pattern to save handlers when `updateEntity` internally calls `parseAndSaveData`:
```ts
await updateEntity(undefined, undefined, false)
await nextTick()
setOriginalSavedData()
```

## Gotcha: onFormValuesChange completeness

`onFormValuesChange` must map **every** field that appears in `prepareUpdateData` into `entityDataUpdate`. If a field is missing here, changes to it won't set `hasUnsavedChanges` (the save button stays grey), even though the field will save correctly when triggered by other changes.

When there are standalone refs that contribute to the update payload (e.g. `selectedBillingAddressId`) but aren't form fields, add a dedicated `watch()` to sync them — `onFormValuesChange` only fires on form value changes.

## Gotcha: VeeValidate field unmount in read-only/sent mode

When a page switches from form-mode to read-only (e.g. draft → sent status), VeeValidate unregisters fields as they leave the DOM and clears their values. The debounced `onFormValuesChange` then fires with empty values and can wipe `entityDataUpdate`. Fix: add a mode guard at the top of the edit-mode branch:

```ts
function onFormValuesChange(values) {
  if (sentMode.value) return   // guard against VeeValidate clearing unmounted fields
  // ...map fields into entityDataUpdate
}
```

In sent mode, read display values from `entityData` (populated by `reshapeEntityData`), not from `form.values`.

## Gotcha: reactive refresh after status transitions

`refresh()` from `useAsyncData` updates `data.value` but `parseAndSaveData` is only called inside `onMounted`. If the page calls `refreshEntityData` after a status transition, add a watcher inside the `if (!createMode.value)` block:

```ts
watch(data, async (newData) => {
  await parseAndSaveData(newData, false)
  await nextTick()
  setOriginalSavedData()
})
```

The watch fires only on subsequent changes, so it doesn't interfere with the initial `onMounted` flow.

## Gotcha: display-only response data

For fields the API returns but the PATCH endpoint doesn't accept (e.g. nested snapshot objects like `billingAddress`, `company`, `total`), store them in dedicated `ref`s populated in `parseEntityData`. Don't cast `entityDataUpdate` to the response type or spread the full entity into the update payload — the backend will reject unknown fields.

## Verify

- Create mode: submit form → auto-navigates to edit URL → data is pre-populated
- Edit mode: reload page on existing entity → form is populated
- Unsaved changes: indicator doesn't flicker on load; enables on changes; clears after save
- Read-only/sent mode: no empty-value wipe on field unmount
- Run `pnpm lint:check` and `pnpm typecheck`
- Run `pnpm test --run` when tests exist for the changed code
