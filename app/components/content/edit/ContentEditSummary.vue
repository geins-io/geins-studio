<script setup lang="ts">
import type { StatusBadgeStatus } from '#shared/types';

const props = withDefaults(
  defineProps<{
    createMode?: boolean;
    description?: string;
    formTouched?: boolean;
    summary?: DataItem[];
    settingsSummary?: DataItem[];
    entityName?: string;
    entityLiveStatus?: boolean;
    showActiveStatus?: boolean;
    status?: StatusBadgeStatus;
  }>(),
  {
    createMode: false,
    description: '',
    formTouched: false,
    summary: () => [],
    settingsSummary: () => [],
    entityLiveStatus: false,
    showActiveStatus: true,
  },
);

const { t } = useI18n();

const sidebarFloating = inject<Ref<boolean>>('sidebar-floating', ref(false));

const active = defineModel<boolean>('active');

const hasExplicitStatus = computed(() => props.status !== undefined);
const displayStatus = computed(() =>
  hasExplicitStatus.value ? props.status! : props.entityLiveStatus,
);

const description = computed(() => {
  return props.createMode && props.summary?.length === 0
    ? t('create_summary_description')
    : props.description;
});

const activeDescription = computed(() => {
  if (active.value && props.entityLiveStatus) {
    return t('entity_is_active', { entityName: props.entityName });
  }
  if (!active.value && !props.entityLiveStatus) {
    return t('entity_is_inactive', { entityName: props.entityName });
  }
  if (active.value && !props.entityLiveStatus) {
    return t('entity_will_activate', { entityName: props.entityName });
  }
  if (!active.value && props.entityLiveStatus) {
    return t('entity_will_deactivate', { entityName: props.entityName });
  }
  return '';
});
</script>
<template>
  <Card
    :class="
      cn(
        'space-y-4 p-6',
        sidebarFloating && '@max-2xl:max-h-[80vh] @max-2xl:overflow-y-auto',
      )
    "
  >
    <div class="flex items-center justify-between">
      <ContentCardHeader :title="$t('summary')" :description="description" />
      <StatusBadge
        v-if="!createMode && (hasExplicitStatus || showActiveStatus)"
        :status="displayStatus"
      />
    </div>
    <slot name="before-active-switch" />
    <ContentSwitch
      v-if="!createMode && showActiveStatus"
      v-model:checked="active"
      :label="active ? $t('active') : $t('inactive')"
      :description="activeDescription"
    />
    <slot name="before-summary" />
    <ContentDataList v-if="summary.length" :data-list="summary" />
    <slot name="after-summary" />
    <ContentDataList
      v-if="!createMode && settingsSummary.length"
      :data-list="settingsSummary"
      :label="$t('settings')"
    />
    <slot name="after-settings" />
  </Card>
</template>
