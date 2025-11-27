<script setup lang="ts">
interface EntityEditSummary {
  createMode?: boolean;
  description?: string;
  formTouched?: boolean;
  summary?: DataItem[];
  settingsSummary?: DataItem[];
  entityName?: string;
  entityLiveStatus?: boolean;
  showActiveStatus?: boolean;
}

const props = withDefaults(defineProps<EntityEditSummary>(), {
  createMode: false,
  description: '',
  formTouched: false,
  summary: () => [],
  settingsSummary: () => [],
  entityLiveStatus: false,
  showActiveStatus: true,
});

const { t } = useI18n();

const active = defineModel<boolean>('active');

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
  <Card class="max-h-[80vh] space-y-4 overflow-y-auto p-6">
    <div class="flex items-center justify-between">
      <ContentCardHeader :title="t('summary')" :description="description" />
      <Badge
        v-if="!createMode && showActiveStatus"
        :variant="entityLiveStatus ? 'positive' : 'secondary'"
      >
        {{ entityLiveStatus ? t('active') : t('inactive') }}
      </Badge>
    </div>
    <slot name="before-active-switch" />
    <ContentSwitch
      v-if="!createMode && showActiveStatus"
      v-model:checked="active"
      :label="active ? t('active') : t('inactive')"
      :description="activeDescription"
    />
    <slot name="before-summary" />
    <ContentDataList v-if="summary.length" :data-list="summary" />
    <slot name="after-summary" />
    <ContentDataList
      v-if="!createMode && settingsSummary.length"
      :data-list="settingsSummary"
      :label="t('settings')"
    />
    <slot name="after-settings" />
  </Card>
</template>
