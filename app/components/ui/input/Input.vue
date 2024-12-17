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
    :class="cn(`@`, props.class)"
    v-bind="$attrs"
  />
  <p v-if="!valid && feedback" class="text-sm font-semibold text-destructive">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-sm text-muted-foreground">
    {{ description }}
  </p>
</template>
