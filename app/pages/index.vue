<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
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
} = useDashboard();

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

const breadcrumbsStore = useBreadcrumbsStore();
breadcrumbsStore.setShowBreadcrumbs(false);
</script>

<template>
  <ContentHeader :title="greeting" :description="today">
    <div class="flex items-start gap-2">
      <template v-if="editing">
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
  <Feedback v-if="editing" type="info" class="mb-4">
    <template #description>{{ $t('dashboards.edit_hint') }}</template>
  </Feedback>
  <!-- Rendered once measured, so phones never flash the grid first -->
  <div ref="board">
    <DashboardBoard
      v-if="width > 0"
      v-model:layout="layout"
      :items="items"
      :stacked="stacked"
      :editing="editing"
      @remove="removeWidget"
    />
  </div>
</template>
