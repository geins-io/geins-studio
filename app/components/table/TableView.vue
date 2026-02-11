<script setup lang="ts" generic="TData extends Record<string, any>, TValue">
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
import { useDebounceFn } from '@vueuse/core';
import { TableMode } from '#shared/types';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  Column,
  ExpandedState,
} from '@tanstack/vue-table';
import type { Component } from 'vue';
import { LucideSearchX, LucideCircleSlash } from '#components';

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    entityName?: string;
    idColumn?: string;
    pageSize?: number;
    loading?: boolean;
    searchableFields?: Array<keyof TData>;
    mode?: TableMode;
    maxHeight?: string;
    showSearch?: boolean;
    pinnedState?: ColumnPinningState | null;
    selectedIds?: string[];
    emptyText?: string;
    emptyDescription?: string;
    emptyFilteredText?: string;
    emptyFilteredDescription?: string;
    emptyIcon?: Component;
    showEmptyActions?: boolean;
    initVisibilityState?: VisibilityState;
    enableExpanding?: boolean;
    getSubRows?: (row: TData) => TData[] | undefined;
  }>(),
  {
    entityName: 'row',
    idColumn: '_id',
    pageSize: 30,
    loading: false,
    searchableFields: () => ['_id', 'name'],
    showSearch: false,
    showEmptyActions: true,
    mode: TableMode.Advanced,
    enableExpanding: false,
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
const globalFilter = ref('');
const searchInput = ref(''); // Local search input for debouncing
const expanded = ref<ExpandedState>({});

const { getSkeletonColumns, getSkeletonData } = useSkeleton();

const tableMaximized = useState<boolean>('table-maximized', () => false);
const advancedMode = computed(() => props.mode === TableMode.Advanced);
const simpleMode = computed(() => props.mode === TableMode.Simple);

// Debounced search - wait 300ms after user stops typing
const debouncedSearch = useDebounceFn((value: string) => {
  globalFilter.value = value;
}, 300);

// Watch search input and apply debounce
watch(searchInput, (newValue) => {
  debouncedSearch(newValue);
});

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
const columnVisibilityCookie = advancedMode.value
  ? useCookie<VisibilityState>(`geins-cols-${cookieKey}`, {
      default: () => props.initVisibilityState || {},
      maxAge: 60 * 60 * 24 * 365,
    })
  : ref(props.initVisibilityState || {});
const columnVisibility = ref(
  advancedMode.value && Object.keys(columnVisibilityCookie.value).length
    ? columnVisibilityCookie.value
    : props.initVisibilityState || {},
);
const updateVisibilityCookie = () => {
  if (advancedMode.value) {
    columnVisibilityCookie.value = columnVisibility.value;
  }
};
watch(columnVisibility, updateVisibilityCookie, { deep: true });

/**
 * Setup column order
 **/
const columnOrderCookie = advancedMode.value
  ? useCookie<ColumnOrderState>(`geins-order-${cookieKey}`, {
      default: () => [],
      maxAge: 60 * 60 * 24 * 365,
    })
  : ref([]);
const columnOrder = ref(advancedMode.value ? columnOrderCookie.value : []);
const updateSortingCookie = () => {
  if (advancedMode.value) {
    columnOrderCookie.value = columnOrder.value;
  }
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
  getExpandedRowModel: props.enableExpanding
    ? getExpandedRowModel()
    : undefined,
  getSubRows: props.enableExpanding ? props.getSubRows : undefined,
  globalFilterFn: props.enableExpanding
    ? (row, columnId, filterValue) => {
        // Custom global filter for hierarchical data
        const search = String(filterValue).toLowerCase();

        // Check if any searchable field in the current row matches
        const rowMatches =
          props.searchableFields?.some((field) => {
            const value = row.original[field];
            return (
              value != null && String(value).toLowerCase().includes(search)
            );
          }) ?? false;

        if (rowMatches) return true;

        // If this is a parent row, check if any of its children match
        // This ensures parent rows are kept when children match
        if (row.subRows && row.subRows.length > 0) {
          return row.subRows.some((subRow) => {
            return props.searchableFields?.some((field) => {
              const value = subRow.original[field];
              return (
                value != null && String(value).toLowerCase().includes(search)
              );
            });
          });
        }

        return false;
      }
    : undefined,
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  onGlobalFilterChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, globalFilter),
  getColumnCanGlobalFilter: (column) => {
    // Only allow global filtering on columns specified in searchableFields
    return props.searchableFields?.includes(column.id) ?? false;
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility);
  },
  onColumnPinningChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnPinningState),
  onRowSelectionChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, rowSelection);

    if (props.enableExpanding && props.getSubRows) {
      // For expanding tables, getSelectedRowModel() doesn't include child rows properly
      // We need to manually collect all selected rows from the full hierarchy
      const collectSelectedRows = (rows: any[]): any[] => {
        const selected: any[] = [];
        for (const row of rows) {
          if (row.getIsSelected()) {
            selected.push(row);
          }
          // Recursively check subRows
          if (row.subRows && row.subRows.length > 0) {
            selected.push(...collectSelectedRows(row.subRows));
          }
        }
        return selected;
      };

      const allRows = table.getCoreRowModel().rows;
      const selectedRows = collectSelectedRows(allRows);

      // Only emit leaf rows (children that cannot expand)
      const leafRows = selectedRows.filter((row) => !row.getCanExpand());

      emit(
        'selection',
        leafRows.map((row) => row.original),
      );
    } else {
      // Flat table: use standard selection model
      emit(
        'selection',
        table.getSelectedRowModel().rows.map((row) => row.original),
      );
    }
  },
  onColumnOrderChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnOrder),
  onExpandedChange: props.enableExpanding
    ? (updaterOrValue) => valueUpdater(updaterOrValue, expanded)
    : undefined,
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
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
    get expanded() {
      return props.enableExpanding ? expanded.value : {};
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

// Auto-expand all rows when searching in expandable tables
watch(
  [globalFilter, () => props.data],
  ([newFilter, newData], [oldFilter, oldData]) => {
    if (props.enableExpanding && table) {
      if (newFilter?.trim()) {
        // When search is active, expand all parent rows by building an object with all row IDs set to true
        const allRows = table.getCoreRowModel().rows;
        const expandedState: ExpandedState = {};

        allRows.forEach((row) => {
          if (row.getCanExpand()) {
            expandedState[row.id] = true;
          }
        });

        expanded.value = expandedState;
      } else if (oldFilter?.trim()) {
        // When search is cleared, collapse all rows
        expanded.value = {};
      }
    }
  },
  { immediate: false },
);

const emptyState = computed(() => {
  const hasActiveFilter =
    globalFilter.value?.trim() !== '' || columnFilters.value.length > 0;

  return {
    isFiltered: hasActiveFilter,
    title: hasActiveFilter
      ? props.emptyFilteredText ||
        t('no_entity_found', { entityName: props.entityName }, 2)
      : props.emptyText || t('no_entity', { entityName: props.entityName }, 2),
    description: hasActiveFilter
      ? props.emptyFilteredDescription ||
        t('empty_filtered_description', { entityName: props.entityName }, 2)
      : props.emptyDescription ||
        t('empty_description', { entityName: props.entityName }, 2),
  };
});

const clearFilters = () => {
  globalFilter.value = '';
  columnFilters.value = [];
};

const hasSearchableColumns = computed(() => {
  return props.searchableFields && props.searchableFields.length > 0;
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
    <div
      v-if="hasSearchableColumns"
      :class="`relative w-full ${advancedMode ? '@2xl:max-w-sm' : ''}`"
      data-test="table-search"
    >
      <Input
        class="w-full pl-8"
        :placeholder="$t('filter_entity', { entityName }, 2)"
        :model-value="searchInput"
        @update:model-value="searchInput = String($event)"
      />
      <span
        class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
      >
        <LucideSearch class="text-foreground size-4" />
      </span>
    </div>

    <TableColumnToggle v-if="advancedMode && columns?.length" :table="table" />
  </div>
  <div
    :class="
      cn(
        'table-view',
        `${advancedMode ? 'table-view--advanced' : ''}`,
        `${tableMaximized ? 'table-view--maximized' : ''}`,
        `${advancedMode && !tableMaximized ? '-mt-40' : ''}`,
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
                `z-30 ${getCellClasses(header.column, true)} table-view__header`,
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
            :data-is-child="row.depth > 0 ? 'true' : undefined"
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
          <TableRow class="hover:bg-transparent">
            <TableCell :colspan="columns.length" class="p-0">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <component
                      :is="
                        emptyState.isFiltered
                          ? LucideSearchX
                          : (emptyIcon ?? LucideCircleSlash)
                      "
                    />
                  </EmptyMedia>
                  <EmptyTitle>{{ emptyState.title }}</EmptyTitle>
                  <EmptyDescription v-if="emptyState.description">
                    {{ emptyState.description }}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent
                  v-if="
                    showEmptyActions &&
                    (emptyState.isFiltered || $slots['empty-actions'])
                  "
                >
                  <div class="gap-2 sm:flex">
                    <slot
                      v-if="$slots['empty-actions'] && !emptyState.isFiltered"
                      name="empty-actions"
                    />
                    <Button
                      v-else-if="emptyState.isFiltered"
                      variant="secondary"
                      @click="clearFilters"
                    >
                      {{ $t('clear_search') }}
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
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
      class="border-border bg-card absolute -top-px -right-px z-50 !size-6"
      @click="tableMaximized = !tableMaximized"
    >
      <LucideMaximize2 v-if="!tableMaximized" class="size-3" />
      <LucideMinimize2 v-else class="size-3" />
    </Button>
  </div>
</template>
