<script lang="ts" setup>
import { reactiveOmit } from '@vueuse/core';
import { CalendarNext, useForwardProps } from 'reka-ui';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils/index';
import type { CalendarNextProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  CalendarNextProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <CalendarNext
    data-slot="calendar-next-button"
    :class="
      cn(
        buttonVariants({ variant: 'outline' }),
        'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        props.class,
      )
    "
    v-bind="forwardedProps"
  >
    <slot>
      <LucideChevronRight class="size-4" />
    </slot>
  </CalendarNext>
</template>
