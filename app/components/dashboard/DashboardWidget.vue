<script setup lang="ts">
import { unrefElement, useResizeObserver } from '@vueuse/core';
import type { DashboardWidgetInstance } from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  DASHBOARD_WIDGETS,
  pixelsToRows,
} from '@/lib/dashboard';

/**
 * The frame every dashboard widget renders itself in: a card with a header
 * (title, description, badge, actions) and a body laid out by the widget's
 * variant. Title, description and variant come from the widget registry.
 * While the board is edited, the header is the drag handle and ✕ removes it.
 * A widget registered with `fit` reports the grid rows its content needs.
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

const body = computed(() => {
  switch (definition.value.variant) {
    // The compact TableView scrolls itself, under its sticky header
    case 'table':
      return { base: 'min-h-0 flex-1', padding: '' };
    case 'flush':
      return { base: 'min-h-0 flex-1', padding: 'px-4 py-3' };
    default:
      return { base: 'flex-1 overflow-auto', padding: 'px-5 py-3' };
  }
});

// The grid starts a drag only from elements with this class
const handleClass = computed(() =>
  editing.value ? 'dashboard-widget-handle cursor-move select-none' : '',
);

// Fitting: the body fills what the grid height leaves, and the content inside
// it keeps its natural height, so card − body + content is the height needed.
// One observer reads all three at once: separate ones would each see a half-
// updated layout after a resize and report rows that then undo themselves.
const fits = computed(
  () => !!definition.value.fit && definition.value.variant !== 'bare',
);
const cardEl = useTemplateRef('card');
const bodyEl = useTemplateRef<HTMLElement>('body');
const contentEl = useTemplateRef<HTMLElement>('content');
const neededHeight = ref(0);

useResizeObserver(
  () => (fits.value ? [bodyEl.value, contentEl.value] : []),
  () => {
    const card = unrefElement(cardEl);
    if (!card || !bodyEl.value || !contentEl.value) return;
    neededHeight.value =
      card.getBoundingClientRect().height -
      bodyEl.value.getBoundingClientRect().height +
      contentEl.value.getBoundingClientRect().height;
  },
);

const fittedRows = computed(() =>
  neededHeight.value > 0
    ? Math.max(definition.value.size.minH, pixelsToRows(neededHeight.value))
    : null,
);

watch(fittedRows, (rows) => {
  if (rows) board?.fit(props.instance.i, rows);
});
</script>

<template>
  <Card
    ref="card"
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
      <div v-if="fits" ref="body" :class="body.base">
        <div ref="content" :class="body.padding">
          <slot />
        </div>
      </div>
      <div v-else :class="cn(body.base, body.padding)">
        <slot />
      </div>
    </template>
  </Card>
</template>
