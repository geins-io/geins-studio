# `useWholesaleOrders`

The `useWholesaleOrders` composable provides utilities for managing wholesale orders data and table display. It handles fetching, transforming, and displaying wholesale orders with proper formatting, column configuration, and reactive state management.

:::warning NOTE
This composable is designed specifically for wholesale orders-related functionalities and may not be suitable for general use cases.
:::

## Features

- **Reactive orders list** with automatic table column generation
- **Data transformation** from API format to display-ready format
- **Column configuration** with internationalization and type formatting

## Usage

### Basic Usage

```ts
const { ordersList, orderColumns, fetchOrders } = useWholesaleOrders();

await fetchOrders(
  orderSelectionQuery,
  { fields: ['priceLists', 'itemcount'] },
  entityId.value,
  allPriceLists.value,
  allaAccounts.value,
  buyersList.value,
);
```

```vue
<TableView :columns="orderColumns" :data="ordersList" entity-name="order" />
```

## Properties and Methods

### `ordersList`

A `ref` containing the list of transformed wholesale orders.

### `orderColumns`

A `computed` property that generates table columns based on `ordersList` and `columnOptionsOrders`.

### `columnOptionsOrders`

An object defining column configuration options for wholesale orders, including:

### `fetchOrders`

```ts
fetchOrders(
  orderSelectionQuery?: OrderBatchQuery,
  orderApiOptions?: OrderApiOptions,
  allPriceLists?: WholesalePriceList[],
  allAccounts?: WholesaleAccount[]
  allBuyers?: WholesaleBuyer[],
): Promise<void>
```

Fetches orders from the API with filtering and transformation.

- **Parameters**:
  - `orderSelectionQuery`: Query filters for orders
  - `orderApiOptions`: API options (e.g. fields to include)
  - `allPriceLists`: Price list entities for name resolution, will add price lists column if provided
  - `allAccounts`: Account entities for name resolution, will add account column if provided
  - `allBuyers`: Buyer entities for name resolution, will add buyer column if provided

- **Features**: Error handling, data caching, automatic transformation

### `transformOrdersForList`

```ts
transformOrdersForList(
  orders: Order[],
  allPriceLists?: WholesalePriceList[],
  allAccounts?: WholesaleAccount[]
  allBuyers?: WholesaleBuyer[],
): WholesaleOrder[]
```

Transforms raw API orders to display-ready format. Used internally by `fetchOrders`.

- **Parameters**:
  - `orders`: Raw orders from API
  - `allPriceLists`: Optional price list entities for resolution
  - `allAccounts`: Optional account entities for resolution
  - `allBuyers`: Optional buyer entities for resolution

- **Returns**: Array of transformed wholesale orders
- **Features**: Price formatting, entity name resolution, tooltip creation

## Type Definitions

```ts
function useWholesaleOrders(): UseWholesaleOrdersReturnType;

interface UseWholesaleOrdersReturnType {
  ordersList: Ref<WholesaleOrder[]>;
  orderColumns: ComputedRef<ColumnDef<WholesaleOrder>[]>;
  columnOptionsOrders: ColumnOptions<WholesaleOrder>;
  fetchOrders: (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    allPriceLists?: WholesalePriceList[],
    allAccounts?: WholesaleAccount[],
  ) => Promise<void>;
  transformOrdersForList: (
    orders: Order[],
    allPriceLists?: WholesalePriceList[],
    allAccounts?: WholesaleAccount[],
  ) => WholesaleOrder[];
}
```

## Dependencies

This composable depends on:

1. **useI18n** for internationalization
