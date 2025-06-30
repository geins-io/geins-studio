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
    <h2 class="mb-1.5 text-xl font-semibold">{{ title }}</h2>
    <p class="text-sm text-muted-foreground">{{ description }}</p>
  </div>
  <div class="flex w-2/5 gap-6">
    <SelectorQuickAdd
      v-if="entities.length"
      :entities="entities"
      :selection="selectedIds"
      :entity-name="entityName"
      @add="$emit('add', $event)"
      @remove="$emit('remove', $event)"
    />
  </div>
</template>
