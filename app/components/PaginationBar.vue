<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';

/**
 * Presentational pagination bar (page size + page nav + total count), driven by
 * plain state — for lists that don't have a TanStack `Table` (e.g. the asset
 * grid). Mirrors the table's `TablePagination` look for consistency.
 */
const props = withDefaults(
  defineProps<{
    /** 1-based current page. */
    page: number;
    pageSize: number;
    total: number;
    /** Raw entity key (e.g. 'asset') for the "N …" + "… per page" labels. */
    entityKey: string;
    pageSizes?: number[];
  }>(),
  {
    pageSizes: () => [24, 48, 96],
  },
);

const emit = defineEmits<{
  'update:page': [number];
  'update:pageSize': [number];
}>();

const { t } = useI18n();
const viewport = useViewport();

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize)),
);
const canPrev = computed(() => props.page > 1);
const canNext = computed(() => props.page < pageCount.value);

function goTo(target: number) {
  emit('update:page', Math.min(Math.max(1, target), pageCount.value));
}
function setSize(value: AcceptableValue) {
  if (!value) return;
  emit('update:pageSize', parseInt(String(value)));
}
</script>

<template>
  <div
    class="flex h-12 w-full items-center justify-between border-t px-2 py-1 text-xs @2xl:h-14 @2xl:px-4 @2xl:py-3"
  >
    <div class="flex-1">
      <span v-if="viewport.isGreaterThan('sm')">
        {{ $t('rows_total', { total, entityKey }, total) }}
      </span>
      <span v-else>
        {{ `${total} ${t(entityKey, total).toLowerCase()}` }}
      </span>
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2 max-sm:hidden">
        <p class="font-semibold">{{ $t('rows_per_page', { entityKey }, 2) }}</p>
        <Select :model-value="`${pageSize}`" @update:model-value="setSize">
          <SelectTrigger size="sm" class="w-auto">
            <SelectValue :placeholder="`${pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="size in pageSizes"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        v-if="total > 0"
        class="sm:text-md flex items-center justify-center text-xs font-semibold sm:w-[100px]"
      >
        {{ t('page_of', { page, total: pageCount }) }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="icon"
          class="hidden size-8 p-0 lg:flex"
          :disabled="!canPrev"
          @click="goTo(1)"
        >
          <span class="sr-only">{{ $t('first_page') }}</span>
          <LucideChevronsLeft class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-0"
          :disabled="!canPrev"
          @click="goTo(page - 1)"
        >
          <span class="sr-only">{{ $t('previous') }}</span>
          <LucideChevronLeft class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-0"
          :disabled="!canNext"
          @click="goTo(page + 1)"
        >
          <span class="sr-only">{{ $t('next') }}</span>
          <LucideChevronRight class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="hidden size-8 p-0 lg:flex"
          :disabled="!canNext"
          @click="goTo(pageCount)"
        >
          <span class="sr-only">{{ $t('last_page') }}</span>
          <LucideChevronsRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
