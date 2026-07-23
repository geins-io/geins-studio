<script setup lang="ts">
// Thin wrapper over the shared Tag — keeps the Selector's removable API.
withDefaults(
  defineProps<{
    label: string;
    removable?: boolean;
  }>(),
  {
    removable: true,
  },
);
const emit = defineEmits(['remove']);
</script>
<template>
  <Tag :label="label" :removable="removable" @remove="emit('remove')" />
</template>
