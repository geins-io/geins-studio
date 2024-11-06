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
const rowSelection = ref({});
const { getSkeletonColumns, getSkeletonData } = useSkeleton();

// Setup column visibility
const { path } = useRoute();
const { user } = useUserStore();
const userId = user?.id || 'default';
const cookieKey = `${userId + path}`;

const columnVisibilityCookie = useCookie<VisibilityState>(
  `geins-cols-${cookieKey}`,
  {
    default: () => ({}),
  },
);

const columnVisibility = ref(columnVisibilityCookie.value);

const updateVisibilityCookie = () => {
  columnVisibilityCookie.value = columnVisibility.value;
};

watch(columnVisibility, updateVisibilityCookie, { deep: true });

const columnVisibilityChoices = computed(() => {
  let columnsArray = Object.keys(columnVisibility.value);
  columnsArray = columnsArray.filter((col) => {
    return !columnVisibility.value[col];
  });
  return columnsArray.length;
});

// Setup table
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
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility);
  },
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
        class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
      >
        <Search class="size-4 text-foreground" />
      </span>
    </div>

    <TableColumnToggle :table="table" :choices="columnVisibilityChoices" />
  </div>
  <div class="rounded-lg border shadow-sm">
    <Table class="relative rounded-t-lg bg-card">
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="hover:bg-card"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="sticky -top-8 z-20 bg-card after:absolute after:bottom-0 after:left-0 after:z-10 after:h-px after:w-full after:bg-border"
            :style="
              header.getSize()
                ? { width: `${header.getSize()}px` }
                : { width: 'auto' }
            "
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
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :style="
                cell.column.getSize()
                  ? { width: `${cell.column.getSize()}px` }
                  : { width: 'auto' }
              "
            >
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
      class="sticky -bottom-8 rounded-b-md bg-background"
      :entity-name="entityName"
      :rows-selectable="rowsSelectable"
      :table="table"
    />
  </div>
</template>
