<script setup lang="ts" generic="TData extends object, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table';
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';

import { valueUpdater } from '@/lib/utils';

import { Search } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    rowsSelectable?: boolean;
    entityName?: string;
    pageSize?: number;
    loading?: boolean;
  }>(),
  {
    rowsSelectable: false,
    entityName: 'row',
    pageSize: 30,
    loading: false,
  },
);

const emit = defineEmits({
  clicked: (row) => row,
});

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const { getSkeletonColumns, getSkeletonData } = useSkeleton();

const table = useVueTable({
  get data() {
    return props.loading ? getSkeletonData<TData>() : props.data;
  },
  get columns() {
    return props.loading ? getSkeletonColumns<TData>() : props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
  },
});
</script>

<template>
  <div class="table-view flex items-center py-4">
    <div class="relative w-full max-w-sm">
      <Input
        class="w-full pl-10"
        placeholder="Filter list..."
        :model-value="table.getColumn('name')?.getFilterValue() as string"
        @update:model-value="table.getColumn('name')?.setFilterValue($event)"
      />
      <span
        class="absolute start-0 inset-y-0 flex items-center justify-center px-3"
      >
        <Search class="size-4 text-foreground" />
      </span>
    </div>

    <TableColumnToggle :table="table" />
  </div>
  <div class="border rounded-md">
    <Table class="relative">
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="sticky z-20 -top-8 bg-background border-b rounded-t-md"
          >
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :data-state="row.getIsSelected() ? 'selected' : undefined"
            @click="emit('clicked', row)"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
    <TablePagination
      class="sticky -bottom-8 bg-background rounded-b-md"
      :entity-name="entityName"
      :rows-selectable="rowsSelectable"
      :table="table"
    />
  </div>
</template>
