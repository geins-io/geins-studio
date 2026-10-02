<script setup lang="ts" generic="TFilters extends object">
import type { ListFilterDefinition } from '#shared/types';
import type { ListFilterEditor } from '@/composables/useListFilters';

defineProps<{
  /** Omitted: the "Select a filter" prompt (the sheet's empty value pane). */
  definition?: ListFilterDefinition<TFilters>;
  /** The committed `useListFilters` instance (applies live) or a `stage()` draft. */
  listFilters: ListFilterEditor<TFilters>;
  /** Fill the container's height instead of capping the list (the sheet). */
  fill?: boolean;
}>();
</script>

<template>
  <p v-if="!definition" class="text-muted-foreground px-3 py-2 text-sm">
    {{ $t('select_a_filter') }}
  </p>
  <!-- Keyed so switching filters (the sheet) starts with an empty search. -->
  <ListFilterMultiSelect
    v-else-if="definition.kind === 'multiselect'"
    :key="definition.name"
    :definition="definition"
    :list-filters="listFilters"
    :fill="fill"
  />
  <ListFilterDateRange
    v-else
    :definition="definition"
    :list-filters="listFilters"
  />
</template>
