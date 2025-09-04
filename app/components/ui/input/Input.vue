<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useVModel } from '@vueuse/core';
import { cn } from '@/lib/utils';

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
        'bg-input relative h-10 w-full rounded-lg border',
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
      :class="
        cn(
          'absolute animate-spin',
          props.size === 'sm' ? 'top-1.5 right-2 size-3.5' : '',
          props.size === 'md' ? 'top-2 right-3 h-4 w-4' : '',
          props.size === 'default' ? 'top-2 right-3 h-5 w-5' : '',
        )
      "
    />
    <div
      v-else-if="$slots.icon"
      class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center"
    >
      <slot name="icon" />
    </div>
    <span
      v-if="$slots.valueDescriptor"
      :class="
        cn(
          'bg-input text-muted-foreground border-r text-xs',
          props.size === 'sm' ? 'pr-2 pl-2' : 'pr-3 pl-3',
        )
      "
    >
      <slot name="valueDescriptor" />
    </span>
    <input
      v-model="modelValue"
      :class="
        cn(
          `bg-input flex h-full w-full ${valid ? '' : 'outline-destructive outline-2 outline-offset-2 outline-solid'} placeholder:text-muted-foreground text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50`,
          props.size === 'sm' ? 'text-xs' : '',
          $slots.valueDescriptor
            ? props.size === 'sm'
              ? 'rounded-r-lg py-1 pr-3 pl-2'
              : 'rounded-r-lg py-1 pr-3 pl-3'
            : 'rounded-lg px-3 py-1',
        )
      "
      v-bind="inputAttrs"
    />
  </div>
  <p v-if="!valid && feedback" class="text-destructive text-sm font-semibold">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-muted-foreground text-sm">
    {{ description }}
  </p>
</template>
