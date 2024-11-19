<script setup lang="ts" generic="TData extends object, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  Column,
} from '@tanstack/vue-table';
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';

import { Search, Maximize2, Minimize2 } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    entityName?: string;
    pageSize?: number;
    loading?: boolean;
  }>(),
  {
    entityName: 'row',
    pageSize: 30,
    loading: false,
  },
);

const emit = defineEmits({
  clicked: (row) => row,
});

/**
 * Setup table state
 */
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const rowSelection = ref({});
const { getSkeletonColumns, getSkeletonData } = useSkeleton();

const tableMaximized = useState<boolean>('table-maximized', () => false);
const rowsSelectable = computed(() =>
  props.columns.some((column) => column.id === 'select'),
);

onUnmounted(() => {
  tableMaximized.value = false;
});

/**
 * Setup column visibility
 **/
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

/**
 * Setup column order
 **/
const columnOrderCookie = useCookie<ColumnOrderState>(
  `geins-order-${cookieKey}`,
  {
    default: () => [],
  },
);
const columnOrder = ref(columnOrderCookie.value);
const updateSortingCookie = () => {
  columnOrderCookie.value = columnOrder.value;
};
watch(columnOrder, updateSortingCookie, { deep: true });

/**
 * Handle pinned columns
 **/

// Get default pinned classes for cells
const pinnedClasses = (column: Column<TData>, header: boolean = false) => {
  const pinned = column.getIsPinned();
  if (pinned) {
    const zIndex =
      header && (column.id === 'select' || column.id === 'actions')
        ? 'z-40'
        : 'z-20';
    return `bg-card sticky ${pinned}-0 ${zIndex} after:absolute after:-bottom-px after:${pinned}-0 after:bg-border after:h-px after:w-full after:z-50`;
  }
  return 'relative';
};

// Set default pinned columns
const defaultPinningState: ColumnPinningState = {
  left: ['select'],
  right: ['actions'],
};

// Remove select and actions columns from pinned state if not present in columns
const columnPinningState = computed(() => {
  const left = defaultPinningState?.left?.filter((id) =>
    props.columns.some((column) => column.id === id),
  );
  const right = defaultPinningState.right?.filter((id) =>
    props.columns.some((column) => column.id === id),
  );
  return { left, right };
});

// Assign extra classes to cells based on pinned columns
const cellClasses = computed(() => {
  const pinnedToLeft = columnPinningState.value?.left?.length || 0;
  const pinnedToRight = columnPinningState.value?.right?.length || 0;
  const classes = [];
  if (pinnedToLeft) {
    classes.push(`[&:nth-child(2)]:border-card`);
  }
  if (pinnedToRight) {
    classes.push('[&:last-child]:border-0');
  }
  return classes.join(' ');
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
  onColumnOrderChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnOrder),
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
    get columnOrder() {
      return columnOrder.value;
    },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
    columnPinning: columnPinningState.value,
  },
});
</script>

<template>
  <div
    :class="
      cn(
        'mb-3 flex origin-top transform items-center transition-[transform]',
        `${tableMaximized ? 'scale-y-0' : ''}`,
      )
    "
  >
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

    <TableColumnToggle :table="table" />
  </div>
  <div
    :class="
      cn(
        'relative mb-[6.5rem] translate-y-40 overflow-hidden rounded-lg border pb-14 shadow-sm transition-[transform]',
        `${tableMaximized ? 'absolute bottom-0 left-8 right-8 top-[4rem] mb-0 translate-y-0' : '-mt-40'}`,
      )
    "
  >
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="hover:bg-card"
        >
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :class="
              cn(
                `z-30 ${pinnedClasses(header.column, true)} sticky top-0 bg-card after:absolute after:bottom-0 after:left-0 after:z-10 after:h-px after:w-full after:bg-border`,
                cellClasses,
              )
            "
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
              :class="cn(`${pinnedClasses(cell.column)}`, cellClasses)"
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
      :entity-name="entityName"
      :rows-selectable="rowsSelectable"
      :table="table"
    />
    <Button
      variant="ghost"
      size="icon"
      class="absolute -right-px -top-px z-50 size-6 border-border bg-card"
      @click="tableMaximized = !tableMaximized"
    >
      <Maximize2 v-if="!tableMaximized" class="size-3" />
      <Minimize2 v-else class="size-3" />
    </Button>
  </div>
</template>
