<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
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
        `flex h-9 w-full rounded-md border border-input ${valid ? '' : 'outline outline-offset-2 outline-2 outline-destructive'} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`,
        props.class,
      )
    "
    v-bind="$attrs"
  />
  <p v-if="!valid && feedback" class="text-destructive font-semibold text-sm">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-muted-foreground text-sm">
    {{ description }}
  </p>
</template>
