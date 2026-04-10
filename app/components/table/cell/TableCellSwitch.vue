<script setup lang="ts">
withDefaults(
  defineProps<{
    value: boolean;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  change: [value: boolean];
}>();
</script>

<template>
  <div class="flex items-center">
    <Switch
      :model-value="value"
      :disabled="disabled"
      @update:model-value="emit('change', $event)"
    />
  </div>
</template>
