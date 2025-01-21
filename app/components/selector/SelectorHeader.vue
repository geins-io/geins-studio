<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    selection: SelectorSelection;
    entities: Entity[];
    entityName: string;
  }>(),
  {},
);
const _emits = defineEmits(['add', 'remove']);
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
      :selection="selection"
      :entity-name="entityName"
      @add="$emit('add', $event)"
      @remove="$emit('remove', $event)"
    />
  </div>
</template>
