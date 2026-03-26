<script setup lang="ts">
const props = defineProps<{
  modelValue?: string;
  label: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const colorInputRef = ref<HTMLInputElement | null>(null);

const displayValue = computed(() => props.modelValue || '#000000');

function openPicker() {
  colorInputRef.value?.click();
}

function onPickerChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function onTextInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div
    class="bg-input flex h-9 w-full items-center gap-3 rounded-md border px-3 py-1"
  >
    <button
      type="button"
      class="size-5 shrink-0 cursor-pointer rounded-lg border"
      :style="{ backgroundColor: displayValue }"
      :aria-label="`Pick ${label} color`"
      @click="openPicker"
    />
    <input
      ref="colorInputRef"
      type="color"
      :value="displayValue"
      class="sr-only"
      tabindex="-1"
      @input="onPickerChange"
    />
    <input
      :value="props.modelValue ?? ''"
      placeholder="#000000"
      class="h-full flex-1 border-0 bg-transparent text-sm outline-none"
      @input="onTextInput"
    />
  </div>
</template>
