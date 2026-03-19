---
name: geins-table-patterns
description: "Patterns for building and extending tables in Geins Studio using TanStack Table + TableView. Use this skill whenever working on tables, list pages, column definitions, editable cells, or table actions in geins-studio — even if the user just says 'add a table', 'set up columns', 'make rows editable', or 'add a copy/delete button'. Trigger on: table, columns, list page, TableView, TanStack, minimal mode, editable columns, copy action, table actions, pagination, useColumns, useTable, TableMode, TableCellEditable."
---

# Geins Studio — Table Patterns

Tables in Geins Studio are built with TanStack Table wrapped by `TableView`. The main abstraction is `useColumns` + `useTable`. See `CLAUDE.md` → "Component UI Patterns - Table Patterns" for the full reference.

## Table modes

`TableMode` (in `shared/types/Table.ts`) controls the visual complexity:

| Mode | Use case | Features |
|------|----------|----------|
| `Advanced` | Full list pages | Pagination, sorting, column toggle, pinning, borders |
| `Simple` | Lightweight nested tables | Reduced chrome |
| `Minimal` | Inline edit-page tables (e.g. quotation items) | No pagination, no sorting, no borders, taller rows |

Pass mode via `table.options.meta.mode`. Minimal-mode styling overrides live in scoped CSS on `.table-view--minimal` in `TableView.vue` — never modify UI primitives for mode-specific styling.

## Building columns with useColumns

Prefer `getColumns()` over hand-rolling `h()` calls — it handles header/cell styles, mode-awareness, and type inference automatically:

```ts
const { columns } = useColumns<RowType>({
  includeColumns: ['name', 'articleNumber', 'quantity', 'createdAt'],
  sortable: false,                    // set false for Minimal mode
  columnTypes: {
    quantity: 'editable-number',
    unitPrice: 'editable-currency',
    status: 'badge',
  },
  columnCellProps: {
    quantity: { onChange: handleQuantityChange, onBlur: handleBlur },
  },
})
```

Column type inference from field names: `date*` → date formatter, `*price`/`*amount` → currency, `*image*`/`*url*` → thumbnail, `product` + `articleNumber` in data → product cell. Override via `columnTypes`.

## Editable columns

Use `columnTypes` with `'editable-number'`, `'editable-string'`, `'editable-currency'`, or `'editable-percentage'`. Pass handlers via `columnCellProps`. For fully custom editable columns, render `TableCellEditable<T>` via `h()`:

```ts
{
  id: 'customField',
  header: () => h('span', 'Label'),
  cell: ({ row }) => h(TableCellEditable<RowType>, {
    row: row.original,
    field: 'customField',
    type: 'number',
    onChange: (row, value) => handleChange(row, value),
  }),
}
```

## Actions column

Default actions are `edit`, `copy`, `delete`. Customise with `addActionsColumn`:

```ts
addActionsColumn<RowType>(columns, {
  availableActions: ['edit', 'copy', 'delete'],
  onEdit: (item) => navigateTo(getEntityUrl(item._id)),
  onCopy: async (item) => {
    try {
      const newEntity = await repository.copy(item._id)
      toast({ title: t('entity_copied', { entityName: item.name }), variant: 'positive' })
      navigateTo(getEntityUrl(newEntity._id))
    } catch {
      showErrorToast(t('error_copying_entity', { entityName: item.name }))
    }
  },
  onDelete: (item) => handleDelete(item._id),
  disabledActions: (item) => item.status !== 'draft' ? ['delete'] : [],
})
```

`disabledActions` can be a static array or a per-row callback.

## Product cell

Use the `'product'` column type (or `TableCellProduct` directly) to show image + name + article number. The row data needs `articleNumber` and `image`/`imageUrl` alongside the accessor field. Prefer the column type over manual `h()` calls.

## Minimal mode — full setup

```vue
<script setup>
const { columns } = useColumns<QuotationItemRow>({
  includeColumns: ['productName', 'skuId', 'quantity', 'unitPrice'],
  sortable: false,
  columnTypes: { quantity: 'editable-number', unitPrice: 'editable-currency' },
  columnCellProps: {
    quantity: { onChange: handleQtyChange },
    unitPrice: { onChange: handlePriceChange },
  },
})
const table = useTable({ data: itemRows, columns })
</script>

<template>
  <TableView :table="table" :mode="TableMode.Minimal" />
</template>
```

## Verify

- Minimal mode: no pagination, no sort arrows, no outer border
- Editable cells: onChange/onBlur fire correctly; values update reactively
- Copy action: creates entity → shows toast → navigates to new URL
- Typecheck passes (`h(TableCellEditable<RowType>, {...})` generic syntax)
