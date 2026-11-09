# `useCompanyOrders`

The `useCompanyOrders` composable provides utilities for managing company orders data and table display. It handles fetching, transforming, and displaying company orders with proper formatting, column configuration, and reactive state management.

:::warning NOTE
This composable is designed specifically for company orders-related functionalities and may not be suitable for general use cases.
:::

## Features

- **Reactive orders list** with automatic table column generation
- **Data transformation** from API format to display-ready format
- **Column configuration** with internationalization and type formatting

## Usage

### Basic Usage

```ts
const { ordersList, orderColumns, fetchOrders } = useCompanyOrders();

await fetchOrders(
  orderSelectionQuery,
  { fields: ['priceLists', 'itemcount'] },
  entityId.value,
  allPriceLists.value,
  allCompanies.value,
  buyersList.value,
);
```

```vue
<TableView
  :columns="orderColumns"
  :data="ordersList"
  entity-key="order"
  :loading="ordersLoading"
  :error="ordersError"
  :on-retry="loadOrders"
/>
```

`loadOrders` is a page-level wrapper that calls `fetchOrders` with the page's own arguments, so the table's retry button repeats the same query.

## Properties and Methods

### `ordersList`

A `ref` containing the list of transformed customer orders.

### `ordersLoading`

A `ref<boolean>` that is `true` while `fetchOrders` runs. Bind it to `TableView`'s `loading` prop.

### `ordersError`

A `ref<boolean>` that is `true` when the last `fetchOrders` call failed. Bind it to `TableView`'s `error` prop, together with `on-retry`, to show the error state with a retry button.

### `orderColumns`

A `computed` property that generates table columns based on `ordersList` and `columnOptionsOrders`.

### `columnOptionsOrders`

An object defining column configuration options for customer orders, including:

### `fetchOrders`

```ts
fetchOrders(
  orderSelectionQuery?: OrderBatchQuery,
  orderApiOptions?: OrderApiOptions,
  allPriceLists?: CustomerPriceList[],
  allCompanies?: CustomerCompany[]
  allBuyers?: CompanyBuyer[],
): Promise<void>
```

Fetches orders from the API with filtering and transformation.

- **Parameters**:
  - `orderSelectionQuery`: Query filters for orders
  - `orderApiOptions`: API options (e.g. fields to include)
  - `allPriceLists`: Price list entities for name resolution, will add price lists column if provided
  - `allCompanies`: Company entities for name resolution, will add company column if provided
  - `allBuyers`: Buyer entities for name resolution, will add buyer column if provided

- **Features**: Error handling, automatic transformation
- **Errors**: `POST /order/query` is a read, so the call passes `suppressErrorToast: true` and no global error toast fires. On failure `ordersList` is emptied and `ordersError` is set; the page shows the failure through the table's error state.

### `transformOrdersForList`

```ts
transformOrdersForList(
  orders: Order[],
  allPriceLists?: CustomerPriceList[],
  allCompanies?: CustomerCompany[]
  allBuyers?: CompanyBuyer[],
): CustomerOrder[]
```

Transforms raw API orders to display-ready format. Used internally by `fetchOrders`.

- **Parameters**:
  - `orders`: Raw orders from API
  - `allPriceLists`: Optional price list entities for resolution
  - `allCompanies`: Optional company entities for resolution
  - `allBuyers`: Optional buyer entities for resolution

- **Returns**: Array of transformed customer orders
- **Features**: Price formatting, entity name resolution, tooltip creation

## Type Definitions

```ts
function useCompanyOrders(): UseCompanyOrdersReturnType;

interface UseCompanyOrdersReturnType {
  ordersList: Ref<CustomerOrder[]>;
  ordersLoading: Ref<boolean>;
  ordersError: Ref<boolean>;
  orderColumns: ComputedRef<ColumnDef<CustomerOrder>[]>;
  columnOptionsOrders: ColumnOptions<CustomerOrder>;
  fetchOrders: (
    orderSelectionQuery?: OrderBatchQuery,
    orderApiOptions?: OrderApiOptions,
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
  ) => Promise<void>;
  transformOrdersForList: (
    orders: Order[],
    allPriceLists?: CustomerPriceList[],
    allCompanies?: CustomerCompany[],
  ) => CustomerOrder[];
}
```

## Dependencies

This composable depends on:

1. **useI18n** for internationalization
