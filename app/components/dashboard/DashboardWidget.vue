<script setup lang="ts">
import type { DashboardWidgetType } from '#shared/types';
import { DASHBOARD_WIDGETS } from '@/lib/dashboard';

/**
 * The frame every dashboard widget renders itself in: a card with a header
 * (title, description, badge, actions) and a body laid out by the widget's
 * variant. Title, description and variant come from the widget registry.
 */
const props = defineProps<{
  type: DashboardWidgetType;
  /** Overrides the registry description, e.g. one that follows a mode */
  description?: string;
  /** A count shown next to the title */
  badge?: number;
}>();

const { t } = useI18n();

const definition = computed(() => DASHBOARD_WIDGETS[props.type]);
const headerDescription = computed(
  () => props.description ?? t(definition.value.descriptionKey),
);

const bodyClass = computed(() => {
  switch (definition.value.variant) {
    // The compact TableView scrolls itself, under its sticky header
    case 'table':
      return 'min-h-0 flex-1';
    case 'flush':
      return 'min-h-0 flex-1 px-4 py-3';
    default:
      return 'flex-1 overflow-auto px-5 py-3';
  }
});
</script>

<template>
  <Card class="flex h-full flex-col overflow-hidden">
    <template v-if="definition.variant === 'bare'">
      <slot />
    </template>
    <template v-else>
      <div class="flex shrink-0 items-start gap-2 border-b px-5 py-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="truncate text-sm font-medium">
              {{ t(definition.titleKey) }}
            </h2>
            <Badge v-if="badge != null" variant="danger">
              {{ badge }}
            </Badge>
          </div>
          <p class="text-muted-foreground mt-0.5 truncate text-xs">
            {{ headerDescription }}
          </p>
        </div>
        <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
          <slot name="actions" />
        </div>
      </div>
      <div :class="bodyClass">
        <slot />
      </div>
    </template>
  </Card>
</template>
