# `QuotationChangelog`

`QuotationChangelog` renders the activity log for a quotation as a [`TableView`](/components/table/TableView) — date, user, action, and a custom changes column that visualizes status transitions and date diffs as inline badges with arrows.

## Features

- Filters out `subEntity === 'message'` entries (those live in [`QuotationCommunications`](/components/quotation/QuotationCommunications))
- Custom changes-column renderer:
  - `status` transitions render as `<StatusBadge from> → <StatusBadge to>`
  - `validTo` date changes render as `formatted from → formatted to`
  - Status + validTo on the same entry render side by side
  - Other property changes render as `property: from → to` separated by `·`
- Built-in retry support (emits `retry` for the consumer)
- Defers TableView mount until columns are derived — prevents the empty-columns hang in TanStack Table

## Usage

```vue
<script setup lang="ts">
const { data: entries, pending, error, refresh } = await useFetch(`/api/quotations/${id}/changelog`);
</script>

<template>
  <QuotationChangelog
    :entries="entries ?? []"
    :loading="pending"
    :error="error !== null"
    @retry="refresh"
  />
</template>
```

## Props

### `entries`

```ts
entries: ChangelogEntry[]
```

Raw changelog entries from the API.

### `loading`

```ts
loading?: boolean
```

Renders skeletons while initial data is fetched.

- **Default:** `false`

### `error`

```ts
error?: boolean
```

Switches the table to its error empty-state with the Retry button (gated on the `retry` listener).

- **Default:** `false`

## Events

### `retry`

Emitted from the table's error empty-state Retry button.

## Type Definitions

```ts
interface ChangelogEntry {
  id: string | number;
  changeDate: string;
  identity?: string;
  action?: string;
  subEntity?: string;
  changes?: string; // JSON-encoded ChangelogChange[]
}

interface ChangelogChange {
  p: string;
  c: string[];
}
```

## Dependencies

- [`TableView`](/components/table/TableView) (in `Simple` mode), [`StatusBadge`](/components/StatusBadge)
- [`useColumns`](/composables/useColumns), [`useDate`](/composables/useDate)
