<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | null;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const displayValue = computed(() => {
  const raw = props.modelValue ?? '';
  return raw.replace(/px$/i, '');
});

function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  // Strip non-numeric characters (allow empty)
  const numeric = input.value.replace(/[^\d]/g, '');
  input.value = numeric;
  emit('update:modelValue', numeric ? `${numeric}px` : '');
}
</script>

<template>
  <div class="bg-input focus-within:border-primary relative h-10 w-full rounded-lg border focus-within:outline-hidden">
    <input
      :value="displayValue"
      :placeholder="placeholder?.replace(/px$/i, '')"
      inputmode="numeric"
      class="bg-input placeholder:text-muted-foreground h-full w-full rounded-lg py-1 pr-9 pl-2 text-sm transition-colors focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:pl-3"
      @input="onInput"
    />
    <span class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
      px
    </span>
  </div>
</template>
