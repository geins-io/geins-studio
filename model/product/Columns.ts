import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Product } from '@/model/product/Product';
import TableCellActions from '@/components/table/cell/TableCellActions.vue';

export const productListColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'id',
    header: () => h('div', 'Id'),
  },
  {
    accessorKey: 'name',
    header: () => h('div', 'Name'),
  },
  {
    accessorKey: 'price',
    header: () => h('div', 'Price'),
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
      }).format(price);
      return h('div', { class: '' }, formatted);
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original;

      return h(
        'div',
        { class: 'relative' },
        h(TableCellActions, {
          product,
        }),
      );
    },
  },
];
