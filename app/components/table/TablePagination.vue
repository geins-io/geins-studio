<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';

const { t } = useI18n();

interface DataTablePaginationProps {
  table: Table<TData>;
  rowsSelectable: boolean;
  entityName: string;
  advanced: boolean;
}

const props = defineProps<DataTablePaginationProps>();

const totalRows = computed(() => props.table.getFilteredRowModel().rows.length);
const viewport = useViewport();
</script>

<template>
  <div
    class="bg-card absolute bottom-0 left-0 flex h-12 w-full items-center justify-between rounded-b-md border-t px-2 py-1 text-xs @2xl:h-14 @2xl:px-4 @2xl:py-3"
  >
    <div class="flex-1">
      <span v-if="rowsSelectable">
        {{
          t(
            'rows_selected',
            {
              selected: table.getFilteredSelectedRowModel().rows.length,
              total: totalRows,
              entityName,
            },
            totalRows,
          )
        }}
      </span>
      <span v-else-if="viewport.isGreaterThan('sm')">
        {{ t('rows_total', { total: totalRows, entityName }, totalRows) }}
      </span>
      <span v-else>{{
        `${totalRows} ${t(entityName, totalRows).toLowerCase()}`
      }}</span>
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div v-if="advanced" class="flex items-center space-x-2 max-sm:hidden">
        <p class="font-semibold">
          {{ t('rows_per_page', { entityName }, 2) }}
        </p>
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="table.setPageSize"
        >
          <SelectTrigger size="sm" class="w-[70px]">
            <SelectValue
              :placeholder="`${table.getState().pagination.pageSize}`"
            />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="pageSize in [30, 60, 120, 240]"
              :key="pageSize"
              :value="`${pageSize}`"
            >
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        v-if="totalRows > 0"
        class="sm:text-md flex items-center justify-center text-xs font-semibold sm:w-[100px]"
      >
        {{
          t('page_of', {
            page: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })
        }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="secondary"
          class="hidden size-8 p-0 lg:flex"
          size="icon"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">Go to first page</span>
          <LucideChevronsLeft class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">Go to previous page</span>
          <LucideChevronLeft class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">Go to next page</span>
          <LucideChevronRight class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="hidden size-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">Go to last page</span>
          <LucideChevronsRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
