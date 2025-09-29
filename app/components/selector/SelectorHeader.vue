<script setup lang="ts" generic="T extends SelectorEntity">
const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    selection: SelectorSelectionInternal;
    entities: T[];
    entityName: string;
  }>(),
  {},
);
const _emits = defineEmits(['add', 'remove']);
const selectedIds = computed(() => props.selection?.ids || []);
</script>
<template>
  <div>
    <ContentCardHeader :title="title" :description="description" size="lg" />
  </div>
  <div class="mt-3 flex w-full gap-6 @3xl:mt-0 @3xl:w-2/5">
    <SelectorQuickAdd
      v-if="entities.length"
      :entities="entities"
      :selection="selectedIds"
      :entity-name="entityName"
      :show-id="true"
      :show-image="true"
      @add="$emit('add', $event)"
      @remove="$emit('remove', $event)"
    />
  </div>
</template>
