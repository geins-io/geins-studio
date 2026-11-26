<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import type { DashboardWidgetType } from '#shared/types';
import type { TabDescriptor } from '@/components/content/edit/ContentEditTabs.vue';
import { DASHBOARD_STACK_BELOW, greetingPeriod } from '@/lib/dashboard';

definePageMeta({
  layout: 'default',
  title: 'Welcome',
});

const { t } = useI18n();
const { formatDate } = useDate();
const { user } = storeToRefs(useUserStore());
const {
  items,
  layout,
  editing,
  startEdit,
  cancelEdit,
  doneEdit,
  removeWidget,
  addWidget,
  resetToDefault,
  updateWidgetConfig,
  fitWidget,
} = useDashboard();
// Created here, so the filter bar and every widget share one filter state
useDashboardFilters();

// A minute tick, so the greeting and date follow the day while the page stays open
const { now } = useLiveClock(true, 60_000);

const greeting = computed(() => {
  const period = t(
    `dashboards.greeting.${greetingPeriod(new Date(now.value))}`,
  );
  const name = user.value?.firstName;
  return name
    ? t('dashboards.greeting_named', { greeting: period, name })
    : period;
});
const today = computed(() =>
  formatDate(new Date(now.value), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
);

const currentTab = ref(0);
const tabs = computed<TabDescriptor[]>(() => [
  { label: t('dashboards.my_work') },
  { label: t('new'), icon: 'Plus', disabled: true, tooltip: t('coming_soon') },
]);

const boardEl = useTemplateRef<HTMLElement>('board');
const { width } = useElementSize(boardEl);
const stacked = computed(() => width.value < DASHBOARD_STACK_BELOW);

const addOpen = ref(false);
// The widget being dragged from the panel onto the board
const dropType = ref<DashboardWidgetType | null>(null);

// From the empty board too, which isn't in edit mode yet
const openAddWidget = () => {
  startEdit();
  addOpen.value = true;
};

// The panel closes after adding, so the new widget is in view
const onAddWidget = (
  type: DashboardWidgetType,
  at?: { x: number; y: number },
) => {
  addWidget(type, at);
  addOpen.value = false;
};

watch(editing, (isEditing) => {
  if (!isEditing) addOpen.value = false;
});

const breadcrumbsStore = useBreadcrumbsStore();
breadcrumbsStore.setShowBreadcrumbs(false);
</script>

<template>
  <ContentHeader :title="greeting" :description="today">
    <div class="flex items-start gap-2">
      <template v-if="editing">
        <ButtonIcon icon="new" variant="secondary" @click="addOpen = true">
          {{ $t('add_entity', { entityKey: 'widget' }) }}
        </ButtonIcon>
        <Button variant="ghost" @click="cancelEdit">{{ $t('cancel') }}</Button>
        <ButtonIcon icon="Check" @click="doneEdit">{{ $t('done') }}</ButtonIcon>
      </template>
      <!-- Drag and resize need the grid, so no editing on a stacked board -->
      <ButtonIcon
        v-else-if="!stacked"
        icon="Pencil"
        variant="secondary"
        @click="startEdit"
      >
        {{ $t('edit_entity', { entityKey: 'dashboard' }) }}
      </ButtonIcon>
    </div>
    <template #tabs>
      <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
    </template>
  </ContentHeader>
  <DashboardFilterBar />
  <!-- Moving and resizing need the grid: no hint on a stacked or empty board -->
  <Feedback v-if="editing && !stacked" type="info" class="mb-4">
    <template #description>{{ $t('dashboards.edit_hint') }}</template>
  </Feedback>
  <Card v-if="!items.length">
    <CardContent class="p-0">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideLayoutGrid class="size-5" />
          </EmptyMedia>
          <EmptyTitle>{{ $t('dashboards.empty_title') }}</EmptyTitle>
          <EmptyDescription>
            {{ $t('dashboards.empty_description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent class="flex-row flex-wrap justify-center gap-2">
          <ButtonIcon icon="new" @click="openAddWidget">
            {{ $t('add_entity', { entityKey: 'widget' }) }}
          </ButtonIcon>
          <ButtonIcon
            icon="LayoutDashboard"
            variant="secondary"
            @click="resetToDefault"
          >
            {{ $t('dashboards.use_default') }}
          </ButtonIcon>
        </EmptyContent>
      </Empty>
    </CardContent>
  </Card>
  <!-- Rendered once measured, so phones never flash the grid first -->
  <div v-else ref="board">
    <DashboardBoard
      v-if="width > 0"
      v-model:layout="layout"
      :items="items"
      :stacked="stacked"
      :editing="editing"
      :drop-type="dropType"
      @remove="removeWidget"
      @fit="fitWidget"
      @update-config="updateWidgetConfig"
      @drop="onAddWidget"
    />
  </div>
  <DashboardAddWidgetPanel
    v-model:open="addOpen"
    v-model:drag-type="dropType"
    :items="items"
    @add="onAddWidget"
  />
</template>
