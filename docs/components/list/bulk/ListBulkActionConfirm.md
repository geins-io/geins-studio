# `ListBulkActionConfirm`

`ListBulkActionConfirm` is the confirm step of a bulk action: "You're about to run “{action}” on {count} …", the action's summary and note, then Confirm runs it through [`useBulkRunner`](/composables/useBulkRunner). [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet) uses it, and a bar shortcut (e.g. Move to trash) can open it directly.

## Features

- The summary box shows `action.summary(value)`, or the label. `action.note(value)` adds a line under it. Use it to say whether the change can be undone (additive actions can't be undone in bulk; trash can be restored).
- `scopeNote` appends a line about what the selection covers (e.g. "This includes assets in its subfolders.").
- Confirm shows a loading state while the chunks run. The dialog closes and emits `done` with the `BulkRunResult`, success or not. Toasts come from `useBulkRunner`.
- Destructive actions get a destructive Confirm button.

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
- shadcn-vue `AlertDialog`, `Button`
