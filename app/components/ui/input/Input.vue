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
    loading?: boolean;
    size?: 'default' | 'sm';
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
</script>

<template>
  <div
    :class="
      cn(
        'relative w-full rounded-lg border bg-input px-3',
        $slots.valueDescriptor ? 'flex items-center' : '',
        'focus-within:border-primary focus-within:outline-none',
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
          'mr-2 border-r pr-2 text-xs text-muted-foreground',
          props.size === 'sm' ? '-ml-1 mr-2 pr-2' : 'mr-3 pr-3',
        )
      "
    >
      <slot name="valueDescriptor" />
    </span>
    <input
      :id="props.id"
      v-model="modelValue"
      :class="
        cn(
          `flex h-10 w-full rounded-lg bg-input ${valid ? '' : 'outline outline-2 outline-offset-2 outline-destructive'} py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
          props.size === 'sm' ? 'h-7 text-xs' : '',
        )
      "
      :autocomplete="autocomplete"
      :placeholder="$attrs?.placeholder ? String($attrs.placeholder) : ''"
      :disabled="$attrs?.disabled ? Boolean($attrs.disabled) : false"
    />
  </div>
  <p v-if="!valid && feedback" class="text-sm font-semibold text-destructive">
    {{ feedback }}
  </p>
  <p v-else-if="description" class="text-sm text-muted-foreground">
    {{ description }}
  </p>
</template>
