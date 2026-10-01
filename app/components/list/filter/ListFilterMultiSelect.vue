<script setup lang="ts" generic="TFilters extends object">
import { ListboxFilter, useFilter } from 'reka-ui';
import type { ListFilterMultiselectDefinition } from '#shared/types';
import type { ListFilterEditor } from '@/composables/useListFilters';

const props = defineProps<{
  definition: ListFilterMultiselectDefinition<TFilters>;
  listFilters: ListFilterEditor<TFilters>;
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const { contains } = useFilter({ sensitivity: 'base' });

const state = computed(() =>
  props.listFilters.resolvedOptions(props.definition.name),
);
const selected = computed(() =>
  props.listFilters.values(props.definition.name),
);
const searchable = computed(() =>
  isListFilterSearchable(props.definition, state.value.options.length),
);

// Own search state rather than `CommandInput`: `CommandItem` clears the
// command's search on every select, which would reset it after each toggle.
const search = ref('');
const visible = computed(() =>
  search.value
    ? state.value.options.filter((o) => contains(o.label, search.value))
    : state.value.options,
);

// Prevented so the listbox doesn't keep its own selection — the filter state
// is the single source.
const toggle = (event: Event, value: string) => {
  event.preventDefault();
  props.listFilters.toggleValue(props.definition.name, value);
};
</script>

<template>
  <Command multiple :model-value="selected" class="bg-transparent">
    <div v-if="searchable" class="border-b px-3 pt-3 pb-2">
      <div
        class="bg-input focus-within:border-primary flex items-center gap-2 rounded-lg border px-3"
      >
        <LucideSearch class="text-muted-foreground size-4 shrink-0" />
        <ListboxFilter
          v-model="search"
          :placeholder="t('global_search_placeholder')"
          class="placeholder:text-muted-foreground flex h-9 w-full bg-transparent text-sm outline-hidden"
        />
      </div>
    </div>

    <div v-if="state.pending" class="space-y-1 px-3 py-2">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-1 py-2">
        <Skeleton class="size-5 rounded-md" />
        <Skeleton class="h-4 w-28" />
      </div>
    </div>
    <div
      v-else-if="state.error"
      class="flex items-center justify-between gap-2 px-3 py-3 text-sm"
    >
      <span class="text-destructive">
        {{ t('failed_to_fetch_entity', { entityKey: 'option' }, 2) }}
      </span>
      <Button size="sm" variant="secondary" @click="state.reload()">
        {{ t('retry') }}
      </Button>
    </div>
    <p
      v-else-if="!visible.length"
      class="text-muted-foreground px-3 py-3 text-center text-sm"
    >
      {{ t('no_entity_found', { entityKey: 'option' }, 2) }}
    </p>
    <CommandList v-else class="max-h-52 px-2 py-2">
      <CommandGroup>
        <CommandItem
          v-for="option in visible"
          :key="option.value"
          :value="option.value"
          class="cursor-pointer gap-3 border-t-0 px-2 py-2"
          @select="(event) => toggle(event, option.value)"
        >
          <Checkbox
            :model-value="selected.includes(option.value)"
            tabindex="-1"
            aria-hidden="true"
            class="pointer-events-none"
          />
          <component
            :is="resolveIcon(option.icon)"
            v-if="option.icon && resolveIcon(option.icon)"
          />
          <span class="truncate">{{ option.label }}</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>
