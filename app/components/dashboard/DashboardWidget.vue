<script setup lang="ts">
import type { DashboardWidgetInstance } from '#shared/types';
import { DASHBOARD_BOARD_CONTEXT, DASHBOARD_WIDGETS } from '@/lib/dashboard';

/**
 * The frame every dashboard widget renders itself in: a card with a header
 * (title, description, badge, actions) and a body laid out by the widget's
 * variant. Title, description and variant come from the widget registry.
 * While the board is edited, the header is the drag handle and ✕ removes it.
 */
const props = defineProps<{
  instance: DashboardWidgetInstance;
  /** Overrides the registry description, e.g. one that follows a mode */
  description?: string;
  /** A count shown next to the title */
  badge?: number;
}>();

const { t } = useI18n();

const board = inject(DASHBOARD_BOARD_CONTEXT, null);
const editing = computed(() => board?.editing.value ?? false);

const definition = computed(() => DASHBOARD_WIDGETS[props.instance.type]);
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

// The grid starts a drag only from elements with this class
const handleClass = computed(() =>
  editing.value ? 'dashboard-widget-handle cursor-move select-none' : '',
);
</script>

<template>
  <Card
    :class="
      cn(
        'flex h-full flex-col overflow-hidden',
        editing && 'ring-link/35 ring-1',
        definition.variant === 'bare' && cn('relative', handleClass),
      )
    "
  >
    <template v-if="definition.variant === 'bare'">
      <slot />
      <div v-if="editing" class="bg-card absolute top-2 right-2 rounded-md">
        <DashboardWidgetRemove @remove="board?.remove(instance.i)" />
      </div>
    </template>
    <template v-else>
      <div
        :class="
          cn('flex shrink-0 items-start gap-2 border-b px-5 py-3', handleClass)
        "
      >
        <LucideGripVertical
          v-if="editing"
          class="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
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
        <div
          v-if="$slots.actions || editing"
          class="flex shrink-0 items-center gap-1"
        >
          <slot name="actions" />
          <DashboardWidgetRemove
            v-if="editing"
            @remove="board?.remove(instance.i)"
          />
        </div>
      </div>
      <div :class="bodyClass">
        <slot />
      </div>
    </template>
  </Card>
</template>
