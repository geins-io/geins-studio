<script setup lang="ts">
import { cn } from '@/utils';
import { MagnifyingGlassIcon } from '@radix-icons/vue';
import {
  ComboboxInput,
  type ComboboxInputProps,
  useForwardProps,
} from 'radix-vue';
import { computed, type HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<
  ComboboxInputProps & {
    class?: HTMLAttributes['class'];
    autoFocus?: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <div
    class="flex items-center rounded-lg border bg-input px-3"
    cmdk-input-wrapper
  >
    <MagnifyingGlassIcon class="mr-2 size-4 shrink-0" />
    <ComboboxInput
      v-bind="{ ...forwardedProps, ...$attrs }"
      :auto-focus="autoFocus"
      :class="
        cn(
          'flex h-9 w-full rounded-lg bg-input py-1 text-sm transition-colors file:border-0 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
    />
  </div>
</template>
