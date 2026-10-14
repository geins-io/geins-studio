# `ListBulkActionConfirm`

`ListBulkActionConfirm` is the confirm step of a bulk action. It reads as one sentence: the title asks the action's question ("Add 2 tags to 63 assets?"), the value shows the way it looks elsewhere, and the button carries the verb. The button runs the action through [`useBulkRunner`](/composables/useBulkRunner). [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet) uses it, and a bar shortcut (e.g. Move to trash) can open it directly.

## Features

- **Title** — `action.confirmTitle(count, value)`. Without it the dialog falls back to "Confirm bulk action" plus a "You're about to run “{action}” on {count} …" line, so an action without its own question still reads right.
- **Value** — `action.summary(value)` picks the display:
  - `{ tags }` — one [`Tag`](/components/Tag) pill per value, capped at 8 with "+N more".
  - `{ path, icon? }` — a trail from the root with chevrons, the last segment emphasised (e.g. a destination folder).
  - `{ list }` — a short bullet list, one row per fact (e.g. the link count and the link mode).
- **Warning** — `action.warning(value)` shows a warning [`Feedback`](/components/Feedback) callout. Use it for a real consequence (a move changes each asset's URL), not for reassurance.
- **Note** — `action.note(value)` is a muted line: what's kept, whether trash can be restored, or that a purge can't be undone.
- `scopeNote` adds a line about what the selection covers (e.g. "This includes assets in its subfolders.").
- Everything under the title is the dialog's description, so screen readers get the value and the consequences too.
- The button says `action.label` and shows a loading state while the chunks run. The dialog closes and emits `done` with the `BulkRunResult`, success or not. Toasts come from `useBulkRunner`.
- Destructive actions get a destructive button. Keep it for hard deletes; soft actions (move to trash) stay regular.

## Usage

```vue
<template>
  <ListBulkActionConfirm
    v-model:open="trashOpen"
    :action="trashAction"
    :ids="selectedIds"
    entity-key="asset"
    @done="onDone"
  />
</template>
```

## Props

| Prop        | Type         | Notes                                          |
| ----------- | ------------ | ---------------------------------------------- |
| `action`    | `BulkAction` | The action to run.                             |
| `value`     | `unknown`    | Its value (from the properties pane).          |
| `ids`       | `string[]`   | The selection.                                 |
| `entityKey` | `string`     | Raw entity key (e.g. `'asset'`) for the count. |
| `scopeNote` | `string`     | Optional line about what the selection covers. |

## Models and events

| Name           | Type                      | Notes                        |
| -------------- | ------------------------- | ---------------------------- |
| `v-model:open` | `boolean`                 |                              |
| `done`         | `(BulkRunResult) => void` | After a run, success or not. |

## Dependencies

- [`useBulkRunner`](/composables/useBulkRunner)
- [`Tag`](/components/Tag), [`Feedback`](/components/Feedback)
- shadcn-vue `AlertDialog`, `Button`
