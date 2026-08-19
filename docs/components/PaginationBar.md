# `PaginationBar`

`PaginationBar` is a presentational pagination control — total count, page-size selector, "Page X of Y", and first / prev / next / last buttons — driven by plain state. Use it for lists that **don't** have a TanStack `Table` instance (e.g. the asset grid); it mirrors the table's [`TablePagination`](/components/table/TablePagination) look so grid and list stay consistent.

## Usage

```vue
<PaginationBar
  :page="page"
  :page-size="pageSize"
  :total="filtered.length"
  :entity-key="entityKey"
  :page-sizes="[24, 48, 96]"
  @update:page="page = $event"
  @update:page-size="pageSize = $event"
/>
```

The [asset library](/domains/assets) grid pairs it with URL query state (`?page`, `?perPage`) so a link opens the exact page.

## Props

### `page`

```ts
page: number; // 1-based
```

### `pageSize`

```ts
pageSize: number;
```

### `total`

```ts
total: number;
```

Total item count — drives the "N …" label and the page count.

### `entityKey`

```ts
entityKey: string;
```

Raw entity key (e.g. `'asset'`) for the `rows_total` ("N assets in total") + `rows_per_page` ("Assets per page") labels.

### `pageSizes`

```ts
pageSizes?: number[]; // default [24, 48, 96]
```

Options in the page-size selector.

## Events

### `update:page` / `update:pageSize`

Emitted (clamped to `[1, pageCount]` for page) when the user navigates or changes the size. The parent owns the state.

## Dependencies

- shadcn-vue `Button`, `Select`; `useViewport` — responsive total label
