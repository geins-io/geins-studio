# `TableColumnToggle`

`TableColumnToggle` is the column visibility + ordering sheet rendered in [`TableView`](/components/table/TableView)'s advanced mode. Users pick which columns are visible and drag to reorder; saved order persists via cookie.

## Features

- Two-pane sheet: available columns on the left, chosen columns on the right
- Drag-and-drop reorder via `vuedraggable`
- "X" buttons hide a column directly from the chosen pane
- Reset on cancel — only `Save` commits visibility and order changes
- Static columns (`select`, `actions` by default) are excluded from the toggle UI and pinned in the saved order

## Usage

`TableView` mounts this internally when `mode` is `TableMode.Advanced`. Standalone use is rare — typically only when building a custom table:

```vue
<template>
  <TableColumnToggle :table="table" :static-columns="['select', 'actions']" />
</template>
```

## Props

### `table`

```ts
table: Table<TData>
```

[TanStack Table](https://tanstack.com/table/latest/docs/introduction) instance.

### `staticColumns`

```ts
staticColumns?: string[]
```

Column ids excluded from the visibility toggle and always pinned at the start/end of the saved order.

- **Default:** `['select', 'actions']`

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Checkbox`, `Button`, [`ButtonIcon`](/components/button/ButtonIcon)
- [`vuedraggable`](https://github.com/SortableJS/vue.draggable.next) — drag/drop reorder
- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) for column state
