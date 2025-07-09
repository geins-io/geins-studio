<script setup lang="ts">
import { cn } from '@/utils';
import {
  PinInputInput,
  type PinInputInputProps,
  useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<
  PinInputInputProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);

const pinInput = ref<typeof PinInputInput | null>(null);

onMounted(() => {
  const el = pinInput.value?.$el;
  if (props.index === 0 && el instanceof HTMLInputElement) {
    el.focus();
  }
});
</script>

<template>
  <PinInputInput
    ref="pinInput"
    v-bind="forwardedProps"
    :class="
      cn(
        'text-xxl relative flex size-16 items-center justify-center border-y border-r border-border bg-transparent text-center transition-all first:rounded-l-lg first:border-l last:rounded-r-lg focus:relative focus:z-10 focus:outline-hidden focus:ring-1 focus:ring-ring',
        props.class,
      )
    "
  />
</template>
