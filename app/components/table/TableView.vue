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
import type { TableDataSource } from '#shared/types';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  Column,
  ExpandedState,
  Row,
} from '@tanstack/vue-table';
import type { Component, Ref } from 'vue';
import {
  LucideSearchX,
  LucideCircleSlash,
  LucideCircleAlert,
} from '#components';

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    entityKey?: string;
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
    error?: boolean;
    onRetry?: () => void;
    initVisibilityState?: VisibilityState;
    initSortingState?: SortingState;
    enableExpanding?: boolean;
    getSubRows?: (row: TData) => TData[] | undefined;
    dimInactiveRows?: boolean;
    dataSource?: TableDataSource;
    /** Server total (`totalItemCount`); drives the counter and page count. */
    rowCount?: number;
    /** External filters are active — shows the filtered empty state. */
    filtered?: boolean;
    pageSizes?: number[];
  }>(),
  {
    entityKey: 'row',
    idColumn: '_id',
    pageSize: 30,
    loading: false,
    searchableFields: () => ['_id', 'name'],
    showSearch: false,
    showEmptyActions: true,
    mode: TableMode.Advanced,
    enableExpanding: false,
    dimInactiveRows: false,
    dataSource: 'client',
    filtered: false,
    pageSizes: () => [30, 60, 120, 240],
    pinnedState: () => ({
      left: ['select'],
      right: ['actions'],
    }),
  },
);

const pinnedState = toRef(props, 'pinnedState');

const emit = defineEmits({
  selection: (selection: TData[]): TData[] => selection,
  'update:selectedIds': (ids: string[]) => Array.isArray(ids),
  'clear-filters': () => true,
});

// Server mode: the parent owns page, sort and search (bind to `useListQuery`).
const paginationModel = defineModel<PaginationState>('pagination');
const sortingModel = defineModel<SortingState>('sorting', {
  default: () => [],
});
const searchModel = defineModel<string>('search', { default: '' });

const serverMode = props.dataSource === 'server';

const { t } = useI18n();
const showSearch =
  props.mode === TableMode.Advanced ? ref(true) : ref(props.showSearch);

// Minimal mode: disable column pinning
const pinnedStateOverride = computed(() => {
  if (props.mode === TableMode.Minimal) {
    return { left: [] as string[], right: [] as string[] };
  }
  return undefined;
});

/**
 * Setup table state
 */
const sorting: Ref<SortingState> = serverMode
  ? sortingModel
  : ref<SortingState>([]);
if (!serverMode) {
  watch(
    () => props.loading,
    (loading) => {
      if (
        !loading &&
        sorting.value.length === 0 &&
        props.initSortingState?.length
      ) {
        sorting.value = props.initSortingState;
      }
    },
    { immediate: true },
  );
}
// An unbound `v-model:pagination` still needs a state for TanStack to update.
const serverPagination = computed<PaginationState>({
  get: () =>
    paginationModel.value ?? { pageIndex: 0, pageSize: props.pageSize },
  set: (value) => (paginationModel.value = value),
});
const columnFilters = ref<ColumnFiltersState>([]);
// Server mode searches on every keystroke; `useListQuery` owns the debounce.
const globalFilter: Ref<string> = serverMode ? searchModel : ref('');
const searchInput: Ref<string> = serverMode ? searchModel : ref('');
const expanded = ref<ExpandedState>({});

const { getSkeletonColumns, getSkeletonData } = useSkeleton();

const tableMaximized = useState<boolean>('table-maximized', () => false);
const advancedMode = computed(() => props.mode === TableMode.Advanced);
const simpleMode = computed(() => props.mode === TableMode.Simple);
const minimalMode = computed(() => props.mode === TableMode.Minimal);

if (!serverMode) {
  const debouncedSearch = useDebounceFn((value: string) => {
    globalFilter.value = value;
  }, 300);
  watch(searchInput, (newValue) => {
    debouncedSearch(newValue);
  });
}

if (import.meta.dev && serverMode) {
  const { geinsLogWarn } = useGeinsLog('components/TableView.vue');
  if (props.enableExpanding)
    geinsLogWarn('expanding rows are not supported with dataSource="server"');
  if (minimalMode.value)
    geinsLogWarn('TableMode.Minimal is not supported with dataSource="server"');
}

// Server mode keeps the current rows on screen while the next page loads.
const showSkeleton = computed(
  () => props.loading && (!serverMode || props.data.length === 0),
);
const refetching = computed(() => props.loading && !showSkeleton.value);

onUnmounted(() => {
  tableMaximized.value = false;
});

/**
 * Setup row selection
 **/
const rowsSelectable = computed(() =>
  props.columns.some((column) => column.id === 'select'),
);
const rowSelection = ref<RowSelectionState>(
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
    if (serverMode) {
      syncSelectedRows();
      emitServerSelection();
    }
  },
);

/**
 * Server mode: row models only hold the current page, so selected rows are
 * kept here across pages, in selection order. `undefined` = selected (e.g.
 * seeded via `selectedIds`) but its row hasn't been loaded yet.
 */
const selectedRows = new Map<string, TData | undefined>();
const rowIdOf = (row: TData) => String(row[props.idColumn as keyof TData]);
const selectedCount = ref(0);

const syncSelectedRows = () => {
  const ids = Object.keys(rowSelection.value).filter(
    (id) => rowSelection.value[id],
  );
  const idSet = new Set(ids);
  for (const id of selectedRows.keys()) {
    if (!idSet.has(id)) selectedRows.delete(id);
  }
  for (const id of ids) {
    if (!selectedRows.has(id)) selectedRows.set(id, undefined);
  }
  // Re-setting an existing key keeps its place, so order is preserved.
  for (const row of props.data) {
    const id = rowIdOf(row);
    if (selectedRows.has(id)) selectedRows.set(id, row);
  }
  selectedCount.value = selectedRows.size;
};

// Deduped on the loaded ids, so a parent echoing `selectedIds` back can't loop.
const loadedSelectedRows = () =>
  [...selectedRows.values()].filter((row): row is TData => row !== undefined);
let lastEmittedSelection: string | undefined;
const emitServerSelection = () => {
  const loaded = loadedSelectedRows();
  const signature = JSON.stringify(loaded.map(rowIdOf));
  if (signature === lastEmittedSelection) return;
  lastEmittedSelection = signature;
  emit('selection', loaded);
};

if (serverMode) {
  syncSelectedRows();
  // Like client mode, no emit for the initial seed; only for later changes.
  lastEmittedSelection = JSON.stringify(loadedSelectedRows().map(rowIdOf));
  watch(
    () => props.data,
    () => {
      syncSelectedRows();
      emitServerSelection();
    },
  );
}

/**
 * Setup column visibility
 **/
const columnVisibilityCookie = advancedMode.value
  ? useUserRouteCookie<VisibilityState>('geins-cols', {
      default: () => props.initVisibilityState || {},
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
  ? useUserRouteCookie<ColumnOrderState>('geins-order', { default: () => [] })
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
  // Minimal mode: no column pinning
  if (pinnedStateOverride.value) {
    return pinnedStateOverride.value;
  }
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
    return showSkeleton.value ? getSkeletonData<TData>() : props.data;
  },
  get columns() {
    return showSkeleton.value ? getSkeletonColumns<TData>() : props.columns;
  },
  get rowCount() {
    return serverMode ? props.rowCount : undefined;
  },
  manualPagination: serverMode,
  manualSorting: serverMode,
  manualFiltering: serverMode,
  // The backend sorts by a single field.
  enableMultiSort: serverMode ? false : undefined,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel:
    props.mode !== TableMode.Minimal && !serverMode
      ? getPaginationRowModel()
      : undefined,
  getSortedRowModel:
    props.mode !== TableMode.Minimal && !serverMode
      ? getSortedRowModel()
      : undefined,
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
  getFilteredRowModel: serverMode ? undefined : getFilteredRowModel(),
  onGlobalFilterChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, globalFilter),
  getColumnCanGlobalFilter: (column) => {
    // Only allow global filtering on columns specified in searchableFields
    return props.searchableFields?.includes(column.id) ?? false;
  },
  // Undefined in client mode, so TanStack keeps pagination internal.
  onPaginationChange: serverMode
    ? (updaterOrValue) => valueUpdater(updaterOrValue, serverPagination)
    : undefined,
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility);
  },
  onColumnPinningChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnPinningState),
  onRowSelectionChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, rowSelection);

    if (serverMode) {
      syncSelectedRows();
      emit('update:selectedIds', [...selectedRows.keys()]);
      emitServerSelection();
    } else if (props.enableExpanding && props.getSubRows) {
      // For expanding tables, getSelectedRowModel() doesn't include child rows properly
      // We need to manually collect all selected rows from the full hierarchy
      const collectSelectedRows = (rows: Row<unknown>[]): Row<unknown>[] => {
        const selected: Row<unknown>[] = [];
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

      emit('selection', leafRows.map((row) => row.original) as TData[]);
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
    // Undefined falls back to TanStack's internal state (client mode).
    get pagination() {
      return serverMode ? serverPagination.value : undefined;
    },
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
      pageSize: props.mode === TableMode.Minimal ? 99999 : props.pageSize,
    },
    columnPinning: columnPinningState.value,
  },
  meta: {
    mode: props.mode,
    entityKey: props.entityKey,
  },
});

// The prop is only the initial size in `initialState`; follow later changes.
watch(
  () => props.pageSize,
  (size) => {
    if (!serverMode && !minimalMode.value) table.setPageSize(size);
  },
);

// Auto-expand all rows when searching in expandable tables
watch(
  [globalFilter, () => props.data],
  ([newFilter, _newData], [oldFilter, _oldData]) => {
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

/** Deselects every row, including rows on other pages in server mode. */
const clearSelection = () => table.setRowSelection({});
defineExpose({ clearSelection });

const emptyState = computed(() => {
  const hasActiveFilter =
    globalFilter.value?.trim() !== '' ||
    columnFilters.value.length > 0 ||
    props.filtered;

  return {
    isFiltered: hasActiveFilter,
    title: hasActiveFilter
      ? props.emptyFilteredText ||
        t('no_entity_found', { entityKey: props.entityKey }, 2)
      : props.emptyText || t('no_entity', { entityKey: props.entityKey }, 2),
    description: hasActiveFilter
      ? props.emptyFilteredDescription ||
        t('empty_filtered_description', { entityKey: props.entityKey }, 2)
      : props.emptyDescription ||
        t('empty_description', { entityKey: props.entityKey }, 2),
  };
});

const clearFilters = () => {
  searchInput.value = '';
  globalFilter.value = '';
  columnFilters.value = [];
  // Filters outside the table (see `filtered`) belong to the parent.
  emit('clear-filters');
};

// Server mode searches whatever the backend searches, not `searchableFields`.
const hasSearchableColumns = computed(() => {
  return (
    serverMode || (props.searchableFields && props.searchableFields.length > 0)
  );
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
        :placeholder="$t('filter_entity', { entityKey }, 2)"
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
        `${minimalMode ? 'table-view--minimal' : ''}`,
        `${tableMaximized ? 'table-view--maximized' : ''}`,
        `${advancedMode && !tableMaximized ? '-mt-40' : ''}`,
      )
    "
    :aria-busy="refetching || undefined"
  >
    <Table
      :style="maxHeight ? { maxHeight } : {}"
      :class="cn('transition-opacity', refetching && 'opacity-60')"
    >
      <TableHeader v-if="table.getRowModel().rows?.length">
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
                `${simpleMode || minimalMode ? 'bg-background' : ''}`,
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
                  props.dimInactiveRows &&
                    (row.original as Record<string, unknown>).active ===
                      false &&
                    !cell.column.columnDef.meta?.skipInactiveDim
                    ? 'opacity-50'
                    : '',
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
              <!-- Error empty state -->
              <Empty v-if="error">
                <EmptyHeader>
                  <EmptyMedia variant="destructive">
                    <LucideCircleAlert />
                  </EmptyMedia>
                  <EmptyTitle>
                    {{ $t('error_fetching_entity', { entityKey }, 2) }}
                  </EmptyTitle>
                  <EmptyDescription>
                    {{ $t('error_empty_description') }}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent v-if="onRetry">
                  <ButtonIcon icon="retry" variant="secondary" @click="onRetry">
                    {{ $t('retry') }}
                  </ButtonIcon>
                </EmptyContent>
              </Empty>
              <!-- Normal empty state -->
              <Empty v-else>
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
      v-if="!minimalMode"
      :entity-key="entityKey"
      :rows-selectable="rowsSelectable"
      :selected-count="serverMode ? selectedCount : undefined"
      :table="table"
      :advanced="advancedMode"
      :page-sizes="pageSizes"
    />
    <Button
      v-if="advancedMode"
      variant="ghost"
      size="icon"
      class="border-border bg-card absolute -top-px -right-px z-50 size-6!"
      @click="tableMaximized = !tableMaximized"
    >
      <LucideMaximize2 v-if="!tableMaximized" class="size-3" />
      <LucideMinimize2 v-else class="size-3" />
    </Button>
  </div>
</template>

<style scoped>
/* Minimal mode: remove outer border, padding, and rounding from .table-view wrapper */
.table-view--minimal {
  border: 0;
  border-radius: 0;
  padding-bottom: 0;
  overflow: visible;
}

/* Minimal mode: transparent background, no rounded corners on inner container */
.table-view--minimal :deep([data-slot='table-container']) {
  background: transparent;
  border-radius: 0;
}

/* Minimal mode: remove vertical cell borders */
.table-view--minimal :deep(td[data-slot='table-cell']),
.table-view--minimal :deep(th[data-slot='table-head']) {
  border-left: 0;
}

/* Minimal mode: remove header rounding */
.table-view--minimal :deep(th[data-slot='table-head']:first-child) {
  border-top-left-radius: 0;
}
.table-view--minimal :deep(th[data-slot='table-head']:last-child) {
  border-top-right-radius: 0;
}

/* Minimal mode: no row hover */
.table-view--minimal :deep(tr[data-slot='table-row']:hover) {
  background: transparent;
}
</style>
