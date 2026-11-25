<script setup lang="ts">
import { GridItem, GridLayout } from 'grid-layout-plus';
import type {
  DashboardLayoutItem,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import {
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
 */
const props = defineProps<{
  items: DashboardWidgetInstance[];
  stacked?: boolean;
}>();

const layout = defineModel<DashboardLayoutItem[]>('layout', {
  required: true,
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
    return item
      ? [{ position, item, size: DASHBOARD_WIDGETS[item.type].size }]
      : [];
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
    :is-draggable="false"
    :is-resizable="false"
    vertical-compact
    use-css-transforms
    class="-m-4"
  >
    <GridItem
      v-for="{ position, item, size } in placed"
      :key="position.i"
      :i="position.i"
      :x="position.x"
      :y="position.y"
      :w="position.w"
      :h="position.h"
      :min-w="size.minW"
      :min-h="size.minH"
    >
      <component :is="WIDGET_COMPONENTS[item.type]" :instance="item" />
    </GridItem>
  </GridLayout>
</template>
