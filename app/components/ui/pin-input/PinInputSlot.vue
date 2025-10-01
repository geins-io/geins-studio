<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  PinInputInput,
  type PinInputInputProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '@/lib/utils';

const props = defineProps<
  PinInputInputProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <PinInputInput
    data-slot="pin-input-slot"
    v-bind="forwardedProps"
    :class="
      cn(
        'sm:text-xxl border-border focus:ring-ring relative flex size-11 items-center justify-center border-y border-r bg-transparent text-center text-xl transition-all first:rounded-l-lg first:border-l last:rounded-r-lg focus:relative focus:z-10 focus:ring-1 focus:outline-hidden sm:size-16',
        props.class,
      )
    "
  />
</template>
