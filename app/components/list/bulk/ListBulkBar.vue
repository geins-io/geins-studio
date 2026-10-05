<script setup lang="ts">
/**
 * Toolbar strip shown while a list has a selection: the selection count, a
 * "Select all {total}" offer once a whole page is selected, the list's own
 * actions (default slot) and "Deselect all". The count is the selection size,
 * not the rows on screen.
 */
withDefaults(
  defineProps<{
    count: number;
    /** Everything the list's query matches, across pages. */
    total: number;
    /** Offer "Select all {total}" (typically: the page is fully selected). */
    canSelectAll?: boolean;
    selectingAll?: boolean;
  }>(),
  { canSelectAll: false, selectingAll: false },
);

const emit = defineEmits<{ selectAll: []; clear: [] }>();
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:border-l sm:pl-3"
    data-test="list-bulk-bar"
  >
    <span class="font-medium" aria-live="polite">
      {{ $t('count_selected', { count }, count) }}
    </span>
    <Button
      v-if="canSelectAll"
      variant="link"
      size="sm"
      :loading="selectingAll"
      data-test="list-bulk-select-all"
      @click="emit('selectAll')"
    >
      {{ $t('select_all_count', { count: total }, total) }}
    </Button>
    <slot />
    <Button
      variant="link"
      size="sm"
      data-test="list-bulk-clear"
      @click="emit('clear')"
    >
      {{ $t('deselect_all') }}
    </Button>
  </div>
</template>
