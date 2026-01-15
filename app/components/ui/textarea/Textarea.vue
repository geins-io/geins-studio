<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

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
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-hidden transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.class,
      )
    "
  >
    <LucideLoaderCircle
      v-if="loading"
      :class="
        cn(
          'absolute animate-spin',
          props.size === 'sm' ? 'top-2 right-2 size-3.5' : '',
          props.size === 'md' ? 'top-2.5 right-2.5 size-5' : '',
          props.size === 'default' ? 'top-3 right-3 size-5' : '',
        )
      "
    />
    <div
      v-else-if="$slots.icon"
      class="absolute top-3 right-3 flex items-center justify-center"
    >
      <slot name="icon" />
    </div>
    <textarea
      v-model="modelValue"
      data-slot="textarea"
      :class="
        cn(
          `bg-input flex h-full w-full ${valid ? '' : 'outline-destructive outline-2 outline-offset-2 outline-solid'} placeholder:text-muted-foreground text-sm transition-colors focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50`,
          props.size === 'sm' ? 'min-h-12 text-xs' : 'min-h-16',
          'rounded-lg px-2 py-2 sm:px-3',
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
