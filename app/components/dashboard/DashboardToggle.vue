<script setup lang="ts">
import type { DashboardToggleOption } from '#shared/types';

/**
 * A small segmented toggle for a widget's views: header modes, line or bars,
 * total or by channel. Icon options show a tooltip with their label; a
 * disabled option stays hoverable (`aria-disabled`) so its tooltip can say why.
 */
defineProps<{
  options: DashboardToggleOption[];
  /** Accessible name of the group */
  label: string;
}>();

const model = defineModel<string>({ required: true });

const pick = (option: DashboardToggleOption) => {
  if (!option.disabledReason) model.value = option.value;
};

const segmentClass = (option: DashboardToggleOption) =>
  cn(
    'focus-visible:ring-ring inline-flex h-6 items-center justify-center rounded text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden',
    option.icon ? 'w-7' : 'px-2',
    option.disabledReason
      ? 'text-muted-foreground cursor-not-allowed opacity-50'
      : model.value === option.value
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
  );
</script>

<template>
  <TooltipProvider :delay-duration="100">
    <div
      role="group"
      :aria-label="label"
      class="bg-secondary inline-flex shrink-0 items-center gap-0.5 rounded-md p-0.5"
    >
      <template v-for="option in options" :key="option.value">
        <Tooltip v-if="option.icon || option.disabledReason">
          <TooltipTrigger as-child>
            <button
              type="button"
              :class="segmentClass(option)"
              :aria-pressed="model === option.value"
              :aria-disabled="option.disabledReason ? true : undefined"
              :aria-label="option.icon ? option.label : undefined"
              @click="pick(option)"
            >
              <component
                :is="option.icon"
                v-if="option.icon"
                class="size-3.5"
                aria-hidden="true"
              />
              <template v-else>{{ option.label }}</template>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {{ option.disabledReason ?? option.label }}
          </TooltipContent>
        </Tooltip>
        <button
          v-else
          type="button"
          :class="segmentClass(option)"
          :aria-pressed="model === option.value"
          @click="pick(option)"
        >
          {{ option.label }}
        </button>
      </template>
    </div>
  </TooltipProvider>
</template>
