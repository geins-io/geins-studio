# Working with Data Tables

All list pages of the Merchant Center consists av filterable, sortable and paginated data tables. The data tables are based on the shadcn-vue [Data Table](https://www.shadcn-vue.com/components/data-table.html) component which in turn is built using [TanStack Table](https://tanstack.com/table/latest).

## Composables

To easily integrate the data tables in your list pages, the Merchant Center provides composables for handling the data tables.

### `useColumns`

The `useColumns` composable is used to define the columns of the data table based on the data of the table.
