<script setup lang="ts" generic="TFilters extends object">
import type { ListFilterDefinition } from '#shared/types';
import type { UseListFiltersReturnType } from '@/composables/useListFilters';

const props = defineProps<{
  listFilters: UseListFiltersReturnType<TFilters>;
}>();

const emit = defineEmits<{
  /** "All filters" was clicked — open the `ListFilterSheet`. */
  'open-all': [];
}>();

const { t } = useI18n();

const pinnedDefinitions = computed(() =>
  props.listFilters.pinned.value
    .map((name) => props.listFilters.definition(name))
    .filter((d): d is ListFilterDefinition<TFilters> => !!d),
);
const totalActive = computed(() => props.listFilters.totalActive.value);
</script>

<template>
  <div
    class="flex min-w-0 items-center gap-2 overflow-x-auto p-px"
    data-test="list-filter-bar"
  >
    <ListFilterPinned
      v-for="definition in pinnedDefinitions"
      :key="definition.name"
      :definition="definition"
      :list-filters="listFilters"
    />
    <Button
      variant="outline"
      class="shrink-0 gap-2"
      data-test="list-filter-all"
      @click="emit('open-all')"
    >
      <LucideListFilter class="size-4" aria-hidden="true" />
      {{ t('all_entity', { entityKey: 'filter' }, 2) }}
      <Badge
        v-if="totalActive"
        size="sm"
        :aria-label="t('count_selected', { count: totalActive }, totalActive)"
      >
        {{ totalActive }}
      </Badge>
    </Button>
    <Button
      v-if="totalActive"
      variant="link"
      class="shrink-0"
      data-test="list-filter-clear-all"
      @click="listFilters.clearAll()"
    >
      {{ t('clear_all_entity', { entityKey: 'filter' }, 2) }}
    </Button>
  </div>
</template>
