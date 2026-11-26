<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { GridItem, GridLayout } from 'grid-layout-plus';
import type {
  DashboardLayoutItem,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  DASHBOARD_DROP_ID,
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_GRID_GAP,
  DASHBOARD_ROW_HEIGHT,
  DASHBOARD_WIDGETS,
  dashboardCellAt,
  rowsToPixels,
  stackedOrder,
} from '@/lib/dashboard';
import type { Component } from 'vue';
import {
  LazyDashboardWidgetAttentionTile,
  LazyDashboardWidgetCompanyOrders,
  LazyDashboardWidgetExpiringQuotations,
  LazyDashboardWidgetFailedRuns,
  LazyDashboardWidgetNeedsAttention,
  LazyDashboardWidgetQuickAccess,
  LazyDashboardWidgetQuotationRequests,
  LazyDashboardWidgetRecentQuotations,
} from '#components';

/**
 * The dashboard grid: 12 columns, widgets placed by `layout`. With `stacked`
 * (a narrow board) the widgets go one per row in reading order instead.
 * While `editing`, widgets drag by their header and resize from the corner
 * (a widget that fits its content resizes in width only), and a widget
 * dragged in from the Add widget panel (`dropType`) can be dropped onto the
 * grid (`drop`).
 */
const props = defineProps<{
  items: DashboardWidgetInstance[];
  stacked?: boolean;
  editing?: boolean;
  /** The widget being dragged in from the Add widget panel */
  dropType?: DashboardWidgetType | null;
}>();

const emit = defineEmits<{
  remove: [i: string];
  fit: [i: string, h: number];
  'update-config': [i: string, config: Record<string, unknown>];
  drop: [type: DashboardWidgetType, at: { x: number; y: number }];
}>();

const layout = defineModel<DashboardLayoutItem[]>('layout', {
  required: true,
});

provide(DASHBOARD_BOARD_CONTEXT, {
  editing: computed(() => props.editing),
  remove: (i) => emit('remove', i),
  fit: (i, h) => emit('fit', i, h),
  updateConfig: (i, config) => emit('update-config', i, config),
});

// Every widget type needs a component; the Record makes a missing one a type error.
const WIDGET_COMPONENTS: Record<DashboardWidgetType, Component> = {
  'quick-access': LazyDashboardWidgetQuickAccess,
  'list-company-orders': LazyDashboardWidgetCompanyOrders,
  'needs-attention': LazyDashboardWidgetNeedsAttention,
  'attention-quotation-requests': LazyDashboardWidgetAttentionTile,
  'attention-expiring-quotations': LazyDashboardWidgetAttentionTile,
  'attention-failed-runs': LazyDashboardWidgetAttentionTile,
  'queue-quotation-requests': LazyDashboardWidgetQuotationRequests,
  'queue-expiring-quotations': LazyDashboardWidgetExpiringQuotations,
  'queue-failed-runs': LazyDashboardWidgetFailedRuns,
  'list-recent-quotations': LazyDashboardWidgetRecentQuotations,
};

const itemsById = computed(
  () => new Map(props.items.map((item) => [item.i, item])),
);

const placed = computed(() =>
  layout.value.flatMap((position) => {
    const item = itemsById.value.get(position.i);
    if (!item) return [];
    const { size, fit } = DASHBOARD_WIDGETS[item.type];
    // A fitted height is the only one, so the corner resizes the width only
    const minH = fit ? position.h : size.minH;
    const maxH = fit ? position.h : undefined;
    return [{ position, item, minW: size.minW, minH, maxH }];
  }),
);

const stackedEntries = computed(() =>
  stackedOrder(layout.value).flatMap((position) => {
    const item = itemsById.value.get(position.i);
    if (!item) return [];
    const { stackedHeight } = DASHBOARD_WIDGETS[item.type];
    const height =
      stackedHeight === 'auto'
        ? undefined
        : (stackedHeight ?? rowsToPixels(position.h));
    return [{ item, height }];
  }),
);

// ── Dropping a widget from the Add widget panel ─────────────────────────────
// grid-layout-plus's "drag from outside": a stand-in layout entry, moved with
// the grid's own dragEvent, gives the placeholder and pushes widgets aside.
// The listeners sit on the document because the panel is a modal sheet, which
// turns pointer events off on the page, so the board itself never gets them.
// For the same reason the browser won't scroll the page during the drag, so
// the board does it near the top and bottom edges.

const grid = useTemplateRef<InstanceType<typeof GridLayout>>('grid');

const dropEntry = () => layout.value.find((p) => p.i === DASHBOARD_DROP_ID);

/** The cell under the cursor: anywhere across the grid, from its top down */
function cellAt(event: DragEvent, w: number) {
  const el = grid.value?.$el as HTMLElement | undefined;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const left = event.clientX - rect.left;
  const top = event.clientY - rect.top;
  if (left < 0 || left > rect.width || top < 0) return null;
  return dashboardCellAt(left, top, rect.width, w);
}

const SCROLL_EDGE = 64;
const SCROLL_STEP = 24;

function scrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(p).overflowY)) return p;
  }
  return document.documentElement;
}

function scrollNearEdge(event: DragEvent) {
  const el = grid.value?.$el as HTMLElement | undefined;
  if (!el) return;
  const scroller = scrollParent(el);
  const rect = scroller.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  // Faster the closer to the edge
  const speed = (gap: number) =>
    Math.ceil(SCROLL_STEP * (1 - Math.max(gap, 0) / SCROLL_EDGE));
  if (event.clientY < top + SCROLL_EDGE) {
    scroller.scrollTop -= speed(event.clientY - top);
  } else if (event.clientY > bottom - SCROLL_EDGE) {
    scroller.scrollTop += speed(bottom - event.clientY);
  }
}

function clearDrop() {
  const index = layout.value.findIndex((p) => p.i === DASHBOARD_DROP_ID);
  if (index === -1) return;
  const { x, y, w, h } = layout.value[index]!;
  grid.value?.dragEvent('dragend', DASHBOARD_DROP_ID, x, y, h, w);
  layout.value.splice(index, 1);
}

function onDragOver(event: DragEvent) {
  const type = props.dropType;
  if (!type || !props.editing || props.stacked) return;
  const { w, h } = DASHBOARD_WIDGETS[type].size;
  const cell = cellAt(event, w);
  if (!cell) {
    clearDrop();
    return;
  }
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  scrollNearEdge(event);
  // The grid moves entries in place, so the stand-in goes into the same array
  if (!dropEntry()) layout.value.push({ i: DASHBOARD_DROP_ID, ...cell, w, h });
  grid.value?.dragEvent('dragmove', DASHBOARD_DROP_ID, cell.x, cell.y, h, w);
}

function onDrop(event: DragEvent) {
  const type = props.dropType;
  const entry = dropEntry();
  if (!type || !entry) return;
  event.preventDefault();
  const at = { x: entry.x, y: entry.y };
  clearDrop();
  emit('drop', type, at);
}

useEventListener(document, 'dragover', onDragOver);
useEventListener(document, 'drop', onDrop);

// A drag that ends anywhere else, or editing that stops, leaves no stand-in
watch(
  () => !props.dropType || !props.editing || props.stacked,
  (stop) => {
    if (stop) clearDrop();
  },
);
</script>

<template>
  <div v-if="stacked" class="flex flex-col gap-4">
    <div
      v-for="entry in stackedEntries"
      :key="entry.item.i"
      :style="entry.height ? { height: `${entry.height}px` } : undefined"
    >
      <component
        :is="WIDGET_COMPONENTS[entry.item.type]"
        :instance="entry.item"
      />
    </div>
  </div>
  <!-- The grid puts the gap outside the outer widgets too and has no container
       padding option, so -m-4 pulls the board flush with the page. -->
  <GridLayout
    v-else
    ref="grid"
    v-model:layout="layout"
    :col-num="DASHBOARD_GRID_COLUMNS"
    :row-height="DASHBOARD_ROW_HEIGHT"
    :margin="[DASHBOARD_GRID_GAP, DASHBOARD_GRID_GAP]"
    :is-draggable="editing"
    :is-resizable="editing"
    vertical-compact
    use-css-transforms
    class="dashboard-grid -m-4"
  >
    <GridItem
      v-for="{ position, item, minW, minH, maxH } in placed"
      :key="position.i"
      :i="position.i"
      :x="position.x"
      :y="position.y"
      :w="position.w"
      :h="position.h"
      :min-w="minW"
      :min-h="minH"
      :max-h="maxH"
      drag-allow-from=".dashboard-widget-handle"
    >
      <component :is="WIDGET_COMPONENTS[item.type]" :instance="item" />
    </GridItem>
  </GridLayout>
</template>

<style scoped>
/* grid-layout-plus themes itself through these variables (default: red) */
.dashboard-grid {
  --vgl-placeholder-bg: var(--link);
  --vgl-placeholder-opacity: 15%;
  --vgl-resizer-border-color: var(--muted-foreground);
}
.dashboard-grid :deep(.vgl-item--placeholder) {
  border-radius: var(--radius);
}
</style>
