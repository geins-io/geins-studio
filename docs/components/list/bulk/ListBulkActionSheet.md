# `ListBulkActionSheet`

`ListBulkActionSheet` runs one action over a list's selection. A narrow action list sits on the left, the picked action's properties on the right, and Run opens [`ListBulkActionConfirm`](/components/list/bulk/ListBulkActionConfirm).

## Features

- **Actions are config** (`BulkAction` from `#shared/types`), so each domain plugs in its own. An action with a `component` gets a properties pane bound with `v-model` to its value. `initialValue()` seeds that value each time the action is picked, so switching actions drops the old value.
- **Run is gated**: disabled until an action is picked, the selection isn't empty, and `isValid(value)` passes (no `isValid` = always valid).
- `SheetContent width="medium"`: a fixed `w-60` action list and a `flex-1` properties pane from `sm` up, stacked below.
- Not a `PanelEdit`: there is nothing to keep, so closing just drops the draft. Each open starts with no action picked.
- After a run the sheet closes and re-emits `done` from the confirm step.

## Usage

```vue
<script setup lang="ts">
import type { BulkAction, BulkRunResult } from '#shared/types';

const actions = computed<BulkAction[]>(() => [
  {
    key: 'move-to-trash',
    label: t('asset_library.move_to_trash'),
    icon: 'Trash2',
    destructive: true,
    run: (ids, _value, options) => assetApi.bulkDelete(ids, options),
    successMessage: (count) =>
      t('asset_library.bulk_moved_to_trash', { count }, count),
  },
]);

async function onDone(result: BulkRunResult) {
  selectedIds.value = result.failed;
  await refresh();
}
</script>

<template>
  <ListBulkActionSheet
    v-model:open="sheetOpen"
    :actions="actions"
    :ids="selectedIds"
    entity-key="asset"
    @done="onDone"
  />
</template>
```

## `BulkAction`

| Field                      | Type                      | Notes                                                                         |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `key`                      | `string`                  | Unique per sheet.                                                             |
| `label`                    | `string`                  | Translated.                                                                   |
| `icon`                     | `string`                  | Lucide name, resolved with `useLucideIcon`.                                   |
| `component`                | `Component`               | Properties pane, `v-model` to the value. Omit for no input.                   |
| `componentProps`           | `Record<string, unknown>` | Bound onto `component`.                                                       |
| `initialValue()`           | `TValue`                  | Fresh value on pick.                                                          |
| `isValid(value)`           | `boolean`                 | Gates Run. Defaults to valid.                                                 |
| `summary(value)`           | `string`                  | Confirm summary. Defaults to the label.                                       |
| `note(value)`              | `string \| undefined`     | Extra confirm line, e.g. whether the change can be undone.                    |
| `destructive`              | `boolean`                 | Destructive confirm button.                                                   |
| `run(ids, value, options)` | `Promise<unknown>`        | One chunk (≤ 100 ids). Spread `options` into the fetch; let errors propagate. |
| `successMessage(count)`    | `string`                  | Success toast title.                                                          |

## Props

| Prop        | Type           | Notes                                                        |
| ----------- | -------------- | ------------------------------------------------------------ |
| `actions`   | `BulkAction[]` | In list order.                                               |
| `ids`       | `string[]`     | The selection.                                               |
| `entityKey` | `string`       | Raw entity key (e.g. `'asset'`) for the count.               |
| `scopeNote` | `string`       | Optional extra confirm line about what the selection covers. |

## Models and events

| Name           | Type                      | Notes                        |
| -------------- | ------------------------- | ---------------------------- |
| `v-model:open` | `boolean`                 |                              |
| `done`         | `(BulkRunResult) => void` | After a run, success or not. |

## Dependencies

- [`ListBulkActionConfirm`](/components/list/bulk/ListBulkActionConfirm), [`useBulkRunner`](/composables/useBulkRunner)
- shadcn-vue `Sheet`, `Button`
