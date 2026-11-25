<script setup lang="ts">
import { GridItem, GridLayout } from 'grid-layout-plus';
import type {
  DashboardLayoutItem,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  DASHBOARD_GRID_COLUMNS,
  DASHBOARD_GRID_GAP,
  DASHBOARD_ROW_HEIGHT,
  DASHBOARD_WIDGETS,
  rowsToPixels,
  stackedOrder,
} from '@/lib/dashboard';
import type { Component } from 'vue';
import {
  LazyDashboardWidgetCompanyOrders,
  LazyDashboardWidgetQuickAccess,
} from '#components';

/**
 * The dashboard grid: 12 columns, widgets placed by `layout`. With `stacked`
 * (a narrow board) the widgets go one per row in reading order instead.
 * While `editing`, widgets drag by their header and resize from the corner;
 * a widget that fits its content resizes in width only.
 */
const props = defineProps<{
  items: DashboardWidgetInstance[];
  stacked?: boolean;
  editing?: boolean;
}>();

const emit = defineEmits<{
  remove: [i: string];
  fit: [i: string, h: number];
  'update-config': [i: string, config: Record<string, unknown>];
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
