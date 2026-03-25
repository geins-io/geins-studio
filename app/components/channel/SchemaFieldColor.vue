<script setup lang="ts">
const props = defineProps<{
  modelValue?: string;
  label: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="size-5 shrink-0 rounded border"
      :style="{ backgroundColor: props.modelValue || '#000000' }"
    />
    <Input
      :model-value="props.modelValue ?? ''"
      placeholder="#000000"
      class="font-mono"
      @input="onInput"
    />
  </div>
</template>
