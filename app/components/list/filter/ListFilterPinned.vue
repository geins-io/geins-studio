<script setup lang="ts" generic="TFilters extends object">
import type { ListFilterDefinition } from '#shared/types';
import type { ListFilterEditor } from '@/composables/useListFilters';

const props = defineProps<{
  definition: ListFilterDefinition<TFilters>;
  /** The committed `useListFilters` instance — every edit applies live. */
  listFilters: ListFilterEditor<TFilters>;
}>();

const { t } = useI18n();

const count = computed(() =>
  props.listFilters.activeCount(props.definition.name),
);
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        class="border-border-dark hover:border-border-dark-hover hover:bg-card dark:hover:bg-secondary/80 shrink-0 gap-1.5 border-dashed"
        data-test="list-filter-pinned"
      >
        {{ t(definition.label) }}
        <span
          v-if="count"
          class="text-muted-foreground tabular-nums"
          data-test="list-filter-count"
        >
          <span aria-hidden="true">({{ count }})</span>
          <span class="sr-only">
            {{ t('count_selected', { count }, count) }}
          </span>
        </span>
        <LucideChevronDown class="size-3.5 opacity-60" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="w-64 p-0">
      <p class="border-b px-3 py-2.5 text-sm font-semibold">
        {{ t(definition.label) }}
      </p>
      <ListFilterValues :definition="definition" :list-filters="listFilters" />
      <div class="border-t px-3 py-2">
        <Button
          size="xs"
          variant="ghost"
          :disabled="!count"
          @click="listFilters.clear(definition.name)"
        >
          {{ t('clear') }}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
