<script setup lang="ts">
import type { HTMLAttributes, FormHTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    defaultValue?: string | number;
    modelValue?: string | number;
    class?: HTMLAttributes['class'];
    id?: HTMLAttributes['id'];
    autocomplete?: FormHTMLAttributes['autocomplete'];
    valid?: boolean;
    feedback?: string;
    description?: string;
  }>(),
  {
    valid: true,
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <input
    :id="props.id"
    v-model="modelValue"
    :class="
      cn(
        `flex h-10 w-full rounded-lg border bg-input ${valid ? '' : 'outline outline-2 outline-offset-2 outline-destructive'} px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`,
        props.class,
      )
    "
    :autocomplete="autocomplete"
    v-bind="$attrs"
  />
  <p v-if="!valid && feedback" class="text-sm font-semibold text-destructive">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-sm text-muted-foreground">
    {{ description }}
  </p>
</template>
