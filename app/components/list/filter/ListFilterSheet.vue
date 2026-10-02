<script setup lang="ts" generic="TFilters extends object">
import { useFilter } from 'reka-ui';
import type { ListFilterName } from '#shared/types';
import type { UseListFiltersReturnType } from '@/composables/useListFilters';

const props = defineProps<{
  /** The committed `useListFilters` instance; the sheet edits a `stage()` draft of it. */
  listFilters: UseListFiltersReturnType<TFilters>;
}>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const { contains } = useFilter({ sensitivity: 'base' });

const draft = props.listFilters.stage();
const definitions = computed(() => props.listFilters.definitions.value);

const search = ref('');
const visibleDefinitions = computed(() =>
  search.value
    ? definitions.value.filter((d) => contains(t(d.label), search.value))
    : definitions.value,
);

const selectedName = ref<ListFilterName<TFilters>>();
const selected = computed(() =>
  selectedName.value
    ? props.listFilters.definition(selectedName.value)
    : undefined,
);

// However the sheet closes, only "Apply filters" commits; reseeding on open
// also picks up changes made in the pinned popovers meanwhile.
watch(
  open,
  (isOpen) => {
    draft.discard();
    if (!isOpen) return;
    search.value = '';
    selectedName.value = definitions.value[0]?.name;
  },
  { immediate: true },
);

const apply = () => {
  draft.apply();
  open.value = false;
};

const atPinLimit = (name: ListFilterName<TFilters>) =>
  !props.listFilters.canPin(name);
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent width="medium" data-test="list-filter-sheet">
      <SheetHeader>
        <SheetTitle>{{ t('filter_list') }}</SheetTitle>
        <SheetDescription>
          {{ t('filter_list_description', { max: LIST_FILTER_MAX_PINNED }) }}
        </SheetDescription>
      </SheetHeader>

      <SheetBody
        class="grid min-h-0 flex-1 p-0 sm:grid-cols-2 sm:overflow-hidden sm:p-0"
      >
        <div
          class="flex flex-col gap-4 border-b p-4 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-6"
        >
          <p class="text-sm font-semibold">{{ t('filter_by') }}</p>
          <div
            v-if="definitions.length > LIST_FILTER_SEARCH_THRESHOLD"
            class="relative"
          >
            <Input
              v-model="search"
              size="md"
              class="pl-8"
              :placeholder="t('search_entity', { entityKey: 'filter' }, 2)"
              :aria-label="t('search_entity', { entityKey: 'filter' }, 2)"
            />
            <span
              class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
            >
              <LucideSearch class="text-foreground size-4" aria-hidden="true" />
            </span>
          </div>
          <TooltipProvider :delay-duration="100">
            <ul class="flex flex-col gap-0.5">
              <li
                v-for="definition in visibleDefinitions"
                :key="definition.name"
                :class="
                  cn(
                    'group hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5',
                    selectedName === definition.name && 'bg-secondary',
                  )
                "
                data-test="list-filter-sheet-row"
                @click="selectedName = definition.name"
              >
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-2 py-0.5 text-left text-sm outline-hidden"
                  :aria-current="selectedName === definition.name || undefined"
                >
                  <component
                    :is="resolveIcon(listFilterIcon(definition))"
                    class="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span class="flex-1 truncate">{{ t(definition.label) }}</span>
                  <span
                    v-if="draft.activeCount(definition.name)"
                    class="text-muted-foreground text-xs font-medium"
                    :aria-label="
                      t(
                        'count_selected',
                        { count: draft.activeCount(definition.name) },
                        draft.activeCount(definition.name),
                      )
                    "
                  >
                    {{ draft.activeCount(definition.name) }}
                  </span>
                </button>
                <Tooltip v-if="definition.pinnable !== false">
                  <TooltipTrigger as-child>
                    <Button
                      size="xs"
                      variant="ghost"
                      :aria-label="
                        listFilters.isPinned(definition.name)
                          ? t('unpin')
                          : t('pin_to_toolbar')
                      "
                      :aria-pressed="listFilters.isPinned(definition.name)"
                      :aria-disabled="atPinLimit(definition.name) || undefined"
                      :class="
                        cn(
                          'gap-1',
                          !listFilters.isPinned(definition.name) &&
                            'text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                          atPinLimit(definition.name) &&
                            'cursor-not-allowed group-hover:opacity-50 hover:border-transparent hover:bg-transparent focus-visible:opacity-50',
                        )
                      "
                      data-test="list-filter-sheet-pin"
                      @click.stop="listFilters.togglePin(definition.name)"
                    >
                      <LucidePin class="size-3.5" aria-hidden="true" />
                      <span v-if="listFilters.isPinned(definition.name)">
                        {{ t('pinned') }}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent v-if="atPinLimit(definition.name)">
                    {{
                      t('pin_limit_reached', { max: LIST_FILTER_MAX_PINNED })
                    }}
                  </TooltipContent>
                </Tooltip>
                <LucideChevronRight
                  class="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
              </li>
            </ul>
          </TooltipProvider>
        </div>

        <div class="flex min-h-0 flex-col gap-4 p-4 sm:p-6">
          <p class="text-sm font-semibold">{{ t('filter_values') }}</p>
          <!-- A multiselect scrolls its own list (its search stays put); a date
               range with the calendar open scrolls here. -->
          <div class="-mx-3 min-h-0 flex-1 overflow-y-auto">
            <ListFilterValues
              :definition="selected"
              :list-filters="draft"
              fill
            />
          </div>
        </div>
      </SheetBody>

      <SheetFooter>
        <Button variant="secondary" @click="open = false">
          {{ t('cancel') }}
        </Button>
        <Button data-test="list-filter-sheet-apply" @click="apply">
          {{ t('apply_entity', { entityKey: 'filter' }, 2) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
