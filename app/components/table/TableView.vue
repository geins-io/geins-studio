<script setup lang="ts" generic="TData extends Record<string, any>, TValue">
import { TableMode } from '#shared/types';

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

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    entityName?: string;
    idColumn?: string;
    pageSize?: number;
    loading?: boolean;
    searchableField?: string;
    mode?: TableMode;
    maxHeight?: string;
    showSearch?: boolean;
    pinnedState?: ColumnPinningState | null;
    selectedIds?: string[];
    emptyText?: string;
    initVisibilityState?: VisibilityState;
  }>(),
  {
    entityName: 'row',
    idColumn: '_id',
    pageSize: 30,
    loading: false,
    searchableField: 'name',
    showSearch: false,
    mode: TableMode.Advanced,
    pinnedState: () => ({
      left: ['select'],
      right: ['actions'],
    }),
  },
);

const pinnedState = toRef(props, 'pinnedState');

const emit = defineEmits({
  clicked: (row) => row,
  selection: (selection: TData[]): TData[] => selection,
});

const { t } = useI18n();
const showSearch =
  props.mode === TableMode.Advanced ? ref(true) : ref(props.showSearch);

/**
 * Setup table state
 */
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);

const { getSkeletonColumns, getSkeletonData } = useSkeleton();

const tableMaximized = useState<boolean>('table-maximized', () => false);
const advancedMode = computed(() => props.mode === TableMode.Advanced);
const simpleMode = computed(() => props.mode === TableMode.Simple);

onUnmounted(() => {
  tableMaximized.value = false;
});

/**
 * Setup row selection
 **/
const rowsSelectable = computed(() =>
  props.columns.some((column) => column.id === 'select'),
);
const rowSelection = ref(
  props.selectedIds?.reduce((acc, _id) => ({ ...acc, [_id]: true }), {}) || {},
);
watch(
  () => props.selectedIds,
  (newSelectedIds) => {
    if (!newSelectedIds) {
      return;
    }
    rowSelection.value = newSelectedIds.reduce(
      (acc, _id) => ({ ...acc, [_id]: true }),
      {},
    );
  },
);

/**
 * Setup column visibility
 **/
const { path } = useRoute();
const { user } = useUserStore();
const userId = user?._id || 'default';
const cookieKey = `${userId + path}`;
const columnVisibilityCookie = useCookie<VisibilityState>(
  `geins-cols-${cookieKey}`,
  {
    default: () => props.initVisibilityState || {},
    maxAge: 60 * 60 * 24 * 365,
  },
);
const columnVisibility = ref(
  Object.keys(columnVisibilityCookie.value).length
    ? columnVisibilityCookie.value
    : props.initVisibilityState || {},
);
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
    maxAge: 60 * 60 * 24 * 365,
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

const getCellClasses = (
  column: Column<TData>,
  header: boolean = false,
  lastRow: boolean = false,
) => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');

  const colsPinnedToLeft = columnPinningState.value.left || [];
  const noBorderLeftClass = (() => {
    switch (colsPinnedToLeft.length) {
      case 1:
        return 'nth-2:border-0';
      case 2:
        return 'nth-3:border-0';
      case 3:
        return 'nth-4:border-0';
      default:
        return '';
    }
  })();

  if (isPinned) {
    const zIndex = header ? 'z-40' : 'z-20';
    const shadow = isLastLeftPinnedColumn
      ? '[&>div]:shadow-only-right'
      : isFirstRightPinnedColumn
        ? '[&>div]:shadow-only-left border-l-0 [&>div]:border-l-0'
        : '';
    const afterStyles = !lastRow
      ? `after:absolute after:${isPinned}-0 after:-bottom-px after:bg-border after:h-px after:w-full after:z-50`
      : '';
    return `bg-card sticky border-0 [&:first-child>div]:border-l-0 [&>div]:border-l ${zIndex} ${shadow} ${afterStyles}`;
  }
  return `relative ${noBorderLeftClass}`;
};

const pinnedStyles = computed(() => {
  return (column: Column<TData>) => {
    const isPinned = column.getIsPinned();
    const isFirstRightPinnedColumn =
      isPinned === 'right' && column.getIsFirstColumn('right');

    const subtractWidth = isFirstRightPinnedColumn ? 1 : 0;

    const width = column.getSize() - subtractWidth;

    if (isPinned) {
      const position =
        isPinned === 'left'
          ? column.getStart('left')
          : column.getAfter('right');

      return {
        [isPinned]: `${position}px`,
        width: `${width}px`,
      };
    }
    return { width: width ? `${width}px` : undefined };
  };
});

// Remove select and actions columns from pinned state if not present in columns
const columnPinningState = computed(() => {
  const left =
    pinnedState.value?.left?.filter((id) =>
      props.columns.some((column) => column.id === id),
    ) || [];
  const right =
    pinnedState.value?.right?.filter((id) =>
      props.columns.some((column) => column.id === id),
    ) || [];
  return { left, right };
});

// Setup table
const table = useVueTable({
  getRowId: (row: TData) => String(row[props.idColumn as keyof TData]),
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
  onColumnPinningChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnPinningState),
  onRowSelectionChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, rowSelection);
    emit(
      'selection',
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  },
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
    get columnPinning() {
      return columnPinningState.value;
    },
  },
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
    columnPinning: columnPinningState.value,
  },
  meta: {
    mode: props.mode,
    entityName: props.entityName,
  },
});

const emptyText = computed(() => {
  const emptyText =
    props.emptyText || t('no_entity', { entityName: props.entityName }, 2);
  const column = searchableColumn.value;
  return column && column.getFilterValue()
    ? t('no_entity_found', { entityName: props.entityName }, 2)
    : emptyText;
});

const searchableColumn = computed(() => {
  return props.columns.length
    ? table.getColumn(props.searchableField)
    : undefined;
});
</script>

<template>
  <div
    v-if="showSearch"
    :class="
      cn(
        'mb-3 flex origin-top transform items-center transition-transform',
        `${tableMaximized ? 'scale-y-0' : ''}`,
      )
    "
  >
    <div :class="`relative w-full ${advancedMode ? 'max-w-sm' : ''}`">
      <Input
        v-if="searchableColumn"
        class="w-full pl-10"
        placeholder="Filter list..."
        :model-value="searchableColumn.getFilterValue() as string"
        @update:model-value="searchableColumn.setFilterValue($event)"
      />
      <span
        class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
      >
        <LucideSearch class="text-foreground size-4" />
      </span>
    </div>

    <TableColumnToggle v-if="advancedMode" :table="table" />
  </div>
  <div
    :class="
      cn(
        'text-card-foreground relative overflow-hidden rounded-lg border pb-14 transition-transform',
        `${advancedMode ? 'mb-26 translate-y-40' : ''}`,
        `${advancedMode && !tableMaximized ? '-mt-40' : ''}`,
        `${tableMaximized ? 'absolute top-16 right-8 bottom-0 left-8 -mt-px mb-0 translate-y-0' : ''}`,
      )
    "
  >
    <Table :style="maxHeight ? { maxHeight } : {}">
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
                `z-30 ${getCellClasses(header.column, true)} bg-card after:bg-border sticky top-0 after:absolute after:bottom-0 after:left-0 after:z-10 after:h-px after:w-full`,
                `${simpleMode ? 'bg-background' : ''}`,
              )
            "
            :style="pinnedStyles(header.column)"
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
          >
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :class="
                cn(
                  `${getCellClasses(cell.column, false, row.index === table.getRowModel().rows.length - 1)}`,
                )
              "
              :style="pinnedStyles(cell.column)"
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
              {{ emptyText }}
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
    <TablePagination
      :entity-name="entityName"
      :rows-selectable="rowsSelectable"
      :table="table"
      :advanced="advancedMode"
    />
    <Button
      v-if="advancedMode"
      variant="ghost"
      size="icon"
      class="border-border bg-card absolute -top-px -right-px z-50 size-6"
      @click="tableMaximized = !tableMaximized"
    >
      <LucideMaximize2 v-if="!tableMaximized" class="size-3" />
      <LucideMinimize2 v-else class="size-3" />
    </Button>
  </div>
</template>
