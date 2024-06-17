import { h } from 'vue';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Product } from '@/model/product/Product';
import { ArrowUpDown } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import TableCellActions from '@/components/table/cell/TableCellActions.vue';

export const productListColumns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        'onUpdate:checked': (value: boolean) =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all',
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        checked: row.getIsSelected(),
        'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
        ariaLabel: 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: () => h('div', 'Id'),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Name', h(ArrowUpDown, { class: 'ml-2 size-4' })],
      );
    },
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
