import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Product } from '@/model/product/Product';

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
      return h('div', { class: 'text-right font-medium' }, formatted);
    },
  },
];
