<script setup lang="ts">
import {
  unrefElement,
  useMutationObserver,
  useResizeObserver,
} from '@vueuse/core';
import type { DashboardWidgetInstance } from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  DASHBOARD_WIDGETS,
  pixelsToRows,
} from '@/lib/dashboard';
import type { DashboardListLink } from '@/lib/dashboard-data';

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
  /** Where "View all" in the header leads; no link without it */
  viewAll?: string | DashboardListLink;
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

// Fitting reads card − body + content with the content's fill switched off:
// measured filled, it would always ask for the rows it already has. One read
// covers all three, or each would see a half-updated layout after a resize.
const fits = computed(
  () => !!definition.value.fit && definition.value.variant !== 'bare',
);
const cardEl = useTemplateRef('card');
const bodyEl = useTemplateRef<HTMLElement>('body');
const contentEl = useTemplateRef<HTMLElement>('content');
const neededHeight = ref(0);

function measure() {
  const card = unrefElement(cardEl);
  const bodyBox = bodyEl.value;
  const content = contentEl.value;
  if (!card || !bodyBox || !content) return;
  content.style.flexGrow = '0';
  neededHeight.value =
    card.getBoundingClientRect().height -
    bodyBox.getBoundingClientRect().height +
    content.getBoundingClientRect().height;
  content.style.flexGrow = '';
}

useResizeObserver(
  () => (fits.value ? [bodyEl.value, contentEl.value] : []),
  measure,
);
// Filled, the content keeps its size when what's in it shrinks (fewer
// shortcuts, fewer columns), which the resize observer can't see. Measuring's
// own style toggle on the content doesn't count.
useMutationObserver(
  () => (fits.value ? contentEl.value : null),
  (records) => {
    const own = (record: MutationRecord) =>
      record.type === 'attributes' && record.target === contentEl.value;
    if (records.some((record) => !own(record))) measure();
  },
  {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style'],
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
            <h2 class="truncate text-sm font-semibold">
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
          v-if="$slots.actions || editing || viewAll"
          class="flex shrink-0 items-center gap-1"
        >
          <!-- Hidden while editing: the header is the drag handle then -->
          <NuxtLink
            v-if="viewAll && !editing"
            :to="viewAll"
            class="text-link inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap hover:underline"
          >
            {{ t('dashboards.view_all') }}
            <LucideArrowUpRight class="size-3.5" aria-hidden="true" />
          </NuxtLink>
          <slot name="actions" />
          <DashboardWidgetRemove
            v-if="editing"
            @remove="board?.remove(instance.i)"
          />
        </div>
      </div>
      <div v-if="fits" ref="body" :class="cn(body.base, 'flex flex-col')">
        <div
          ref="content"
          :class="cn('flex shrink-0 grow flex-col', body.padding)"
        >
          <slot />
        </div>
      </div>
      <div v-else :class="cn(body.base, body.padding)">
        <slot />
      </div>
    </template>
  </Card>
</template>
