<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    createMode?: boolean;
    description?: string;
    formTouched?: boolean;
    summary?: DataList;
    entityName?: string;
  }>(),
  {
    createMode: false,
    description: '',
    formTouched: false,
    summary: () => [],
  },
);

const { t } = useI18n();

const active = defineModel<boolean>('active');

const description = computed(() => {
  return props.createMode && props.summary?.length === 0
    ? t('create_summary_description')
    : props.description;
});
</script>
<template>
  <Card class="space-y-4 p-6">
    <ContentCardHeader :title="t('summary')" :description="description" />
    <ContentSwitch
      v-if="!props.createMode"
      v-model:checked="active"
      :label="active ? t('active') : t('inactive')"
      :description="
        active
          ? t('entity_is_active', { entityName })
          : t('entity_is_inactive', { entityName })
      "
    />
    <ContentDataList v-if="summary.length" :data-list="summary" />
  </Card>
</template>
