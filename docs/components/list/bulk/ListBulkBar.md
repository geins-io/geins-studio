# `ListBulkBar`

`ListBulkBar` is the toolbar strip a list shows while it has a selection. It holds the selection count, a "Select all {total}" offer, the list's own actions (default slot) and "Deselect all".

## Features

- The count is the **selection size**, not the rows on screen, so it stays right across pages, search and filters.
- "Select all {total}" shows when `canSelectAll` is set (typically: the whole page is selected and more rows match). `selectingAll` puts it in a loading state while the ids load.
- Actions go in the default slot as `Button variant="link" size="sm"`, to match the built-in buttons.
- From `sm` up it sits inline in the toolbar with a left border.

## Usage

```vue
<template>
  <ListBulkBar
    v-if="selectedIds.length"
    :count="selectedIds.length"
    :total="total"
    :can-select-all="pageSelected && selectedIds.length < total"
    :selecting-all="selectingAll"
    @select-all="selectAllMatching"
    @clear="selectedIds = []"
  >
    <Button variant="link" size="sm" @click="sheetOpen = true">
      {{ $t('choose_action') }}
    </Button>
  </ListBulkBar>
</template>
```

## Props

| Prop           | Type      | Default | Notes                                  |
| -------------- | --------- | ------- | -------------------------------------- |
| `count`        | `number`  | —       | Selection size.                        |
| `total`        | `number`  | —       | Everything the list's query matches.   |
| `canSelectAll` | `boolean` | `false` | Show "Select all {total}".             |
| `selectingAll` | `boolean` | `false` | Loading state on "Select all {total}". |

## Events

| Event       | Payload | Notes                         |
| ----------- | ------- | ----------------------------- |
| `selectAll` | —       | "Select all {total}" clicked. |
| `clear`     | —       | "Deselect all" clicked.       |

## Slots

| Slot      | Notes                                   |
| --------- | --------------------------------------- |
| `default` | The list's actions, between the offers. |

## Dependencies

- shadcn-vue `Button`
- Used with [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet) and [`ListBulkActionConfirm`](/components/list/bulk/ListBulkActionConfirm)
