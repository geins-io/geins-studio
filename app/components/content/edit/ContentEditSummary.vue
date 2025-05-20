<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    createMode?: boolean;
    description?: string;
    formTouched?: boolean;
    summary?: DataItem[];
    settingsSummary?: DataItem[];
    entityName?: string;
    liveStatus?: boolean;
  }>(),
  {
    createMode: false,
    description: '',
    formTouched: false,
    summary: () => [],
    settingsSummary: () => [],
    liveStatus: false,
  },
);

const { t } = useI18n();

const active = defineModel<boolean>('active');

const description = computed(() => {
  return props.createMode && props.summary?.length === 0
    ? t('create_summary_description')
    : props.description;
});

const activeDescription = computed(() => {
  if (active.value && props.liveStatus) {
    return t('entity_is_active', { entityName: props.entityName });
  }
  if (!active.value && !props.liveStatus) {
    return t('entity_is_inactive', { entityName: props.entityName });
  }
  if (active.value && !props.liveStatus) {
    return t('entity_will_activate', { entityName: props.entityName });
  }
  if (!active.value && props.liveStatus) {
    return t('entity_will_deactivate', { entityName: props.entityName });
  }
  return '';
});
</script>
<template>
  <Card class="space-y-4 p-6">
    <div class="flex items-center justify-between">
      <ContentCardHeader :title="t('summary')" :description="description" />
      <Badge
        v-if="!createMode"
        :variant="liveStatus ? 'positive' : 'secondary'"
      >
        {{ liveStatus ? t('active') : t('inactive') }}
      </Badge>
    </div>
    <ContentSwitch
      v-if="!props.createMode"
      v-model:checked="active"
      :label="active ? t('active') : t('inactive')"
      :description="activeDescription"
    />
    <ContentDataList v-if="summary.length" :data-list="summary" />
    <ContentDataList
      v-if="!props.createMode && settingsSummary.length"
      :data-list="settingsSummary"
      :label="t('settings')"
    />
  </Card>
</template>
