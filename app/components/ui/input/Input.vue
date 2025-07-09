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
    valid?: boolean;
    feedback?: string;
    description?: string;
    loading?: boolean;
    size?: 'default' | 'sm' | 'md';
  }>(),
  {
    valid: true,
    size: 'default',
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
const attributes = useAttrs();
const inputAttrs = computed(() => {
  const { class: _, ...attrs } = attributes;
  return attrs;
});
</script>

<template>
  <div
    :class="
      cn(
        'relative h-10 w-full rounded-lg border bg-input',
        props.size === 'sm' ? 'h-7' : '',
        props.size === 'md' ? 'h-9' : '',
        $slots.valueDescriptor ? 'flex items-center' : '',
        'focus-within:border-primary focus-within:outline-hidden',
        props.class,
      )
    "
  >
    <LucideLoaderCircle
      v-if="loading"
      class="absolute right-3 top-2 animate-spin"
    />
    <div
      v-else-if="$slots.icon"
      class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center"
    >
      <slot name="icon" />
    </div>
    <span
      v-if="$slots.valueDescriptor"
      :class="
        cn(
          'border-r bg-input text-xs text-muted-foreground',
          props.size === 'sm' ? 'pl-2 pr-2' : 'pl-3 pr-3',
        )
      "
    >
      <slot name="valueDescriptor" />
    </span>
    <input
      v-model="modelValue"
      :class="
        cn(
          `flex h-full w-full bg-input ${valid ? '' : 'outline-solid outline-2 outline-offset-2 outline-destructive'} text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50`,
          props.size === 'sm' ? 'text-xs' : '',
          $slots.valueDescriptor
            ? props.size === 'sm'
              ? 'rounded-r-lg py-1 pl-2 pr-3'
              : 'rounded-r-lg py-1 pl-3 pr-3'
            : 'rounded-lg px-3 py-1',
        )
      "
      v-bind="inputAttrs"
    />
  </div>
  <p v-if="!valid && feedback" class="text-sm font-semibold text-destructive">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-sm text-muted-foreground">
    {{ description }}
  </p>
</template>
