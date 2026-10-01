<script setup lang="ts" generic="TFilters extends object">
import type { ListFilterDefinition } from '#shared/types';
import type { ListFilterEditor } from '@/composables/useListFilters';

defineProps<{
  /** Omitted: the "Select a filter" prompt (the sheet's empty value pane). */
  definition?: ListFilterDefinition<TFilters>;
  /** The committed `useListFilters` instance (applies live) or a `stage()` draft. */
  listFilters: ListFilterEditor<TFilters>;
}>();
</script>

<template>
  <p v-if="!definition" class="text-muted-foreground px-3 py-2 text-sm">
    {{ $t('select_a_filter') }}
  </p>
  <ListFilterMultiSelect
    v-else-if="definition.kind === 'multiselect'"
    :definition="definition"
    :list-filters="listFilters"
  />
  <ListFilterDateRange
    v-else
    :definition="definition"
    :list-filters="listFilters"
  />
</template>
