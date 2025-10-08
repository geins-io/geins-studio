# `useBatchQuery`

The `useBatchQuery` composable provides pre-configured `BatchQuery` objects for common data fetching scenarios in the Geins API. It simplifies the creation of batch query configurations by offering ready-to-use query objects for fetching all items or disabling pagination.

::: tip
Batch queries are essential for efficiently fetching large datasets from the Geins API. They support pagination, filtering, and conditional data retrieval.
:::

## Features

- Pre-configured query object for matching all items
- Pre-configured query object for disabling pagination (large datasets)

## Usage

Here are the different ways you can use the `useBatchQuery` composable:

### Basic Usage

```ts
const { batchQueryMatchAll, batchQueryNoPagination } = useBatchQuery();

// Use in API repository calls
const allProducts = await productRepo.list(batchQueryMatchAll.value);
const allOrdersNoPagination = await orderRepo.list(
  batchQueryNoPagination.value,
);
```

## Properties and Methods

### `batchQueryMatchAll`

A `ref` containing a `BatchQuery` object configured to match all items.

```ts
const { batchQueryMatchAll } = useBatchQuery();
console.log(batchQueryMatchAll.value); // { all: true }
```

### `batchQueryNoPagination`

A `ref` containing a `BatchQuery` object configured with a very large page size to effectively disable pagination.

```ts
const { batchQueryNoPagination } = useBatchQuery();
console.log(batchQueryNoPagination.value); // { page: 1, pageSize: 10000000 }
```

## Performance Considerations

::: warning
When using these composables with large datasets, be mindful of:

- Memory consumption on the client side
- Network transfer time
- API response limits on the server side
  :::

## Type Definitions

```ts
interface UseBatchQueryReturnType {
  batchQueryMatchAll: Ref<BatchQuery>;
  batchQueryNoPagination: Ref<BatchQuery>;
}

interface BatchQuery {
  _id?: string;
  page?: number;
  pageSize?: number;
  all?: boolean;
}
```
