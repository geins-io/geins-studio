<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    createMode?: boolean;
    description?: string;
    formTouched?: boolean;
    summary?: DataList;
  }>(),
  {
    createMode: false,
    description: '',
    formTouched: false,
    summary: () => [],
  },
);

const active = defineModel<boolean>('active');

const description = computed(() => {
  return props.createMode && props.summary?.length === 0 && !props.formTouched
    ? 'This area will display a summary of the data you add in this section. '
    : props.description;
});
</script>
<template>
  <Card class="p-6">
    <ContentCardHeader title="Summary" :description="description" />
    <ContentDataList v-if="summary.length" :data-list="summary" />
  </Card>
</template>
