<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Separator, type SeparatorProps } from 'reka-ui';
import { cn } from '@/utils';

const props = defineProps<
  SeparatorProps & { class?: HTMLAttributes['class']; label?: string }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    :class="
      cn(
        'relative shrink-0 bg-border',
        props.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        props.class,
      )
    "
  >
    <span
      v-if="props.label"
      :class="
        cn(
          'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-card text-xs text-muted-foreground',
          props.orientation === 'vertical'
            ? 'w-[1px] px-1.5 py-2'
            : 'h-[1px] px-2 py-1',
        )
      "
      >{{ props.label }}</span
    >
  </Separator>
</template>
