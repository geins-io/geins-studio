<script setup lang="ts" generic="T extends string">
import type { ListFilterChip } from '#shared/types';

defineProps<{
  filters: ListFilterChip<T>[];
}>();

const emit = defineEmits<{
  remove: [type: T];
  clear: [];
}>();

const { t } = useI18n();
const removeLabel = (filter: ListFilterChip<T>) =>
  t('remove_filter', { type: filter.typeLabel.toLocaleLowerCase() });
</script>

<template>
  <div
    v-if="filters.length"
    class="bg-muted/50 mb-4 flex items-center justify-between gap-2 rounded-lg border px-4 py-2"
  >
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <LucideFilter class="text-muted-foreground size-4" />
      <span class="text-muted-foreground">{{ $t('filtered_by') }}</span>
      <TooltipProvider :delay-duration="100">
        <span
          v-for="filter in filters"
          :key="filter.type"
          class="bg-background inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 text-xs"
        >
          <span class="text-muted-foreground">{{ filter.typeLabel }}:</span>
          <span class="font-medium">{{ filter.label }}</span>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                type="button"
                class="hover:bg-muted text-muted-foreground hover:text-foreground ml-0.5 rounded-full p-0.5"
                :aria-label="removeLabel(filter)"
                @click="emit('remove', filter.type)"
              >
                <LucideX class="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{{ removeLabel(filter) }}</TooltipContent>
          </Tooltip>
        </span>
      </TooltipProvider>
    </div>
    <ButtonIcon
      icon="X"
      variant="ghost"
      size="sm"
      class="h-7 shrink-0 text-xs"
      @click="emit('clear')"
    >
      {{ $t('clear_filters') }}
    </ButtonIcon>
  </div>
</template>
