<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Separator, type SeparatorProps } from 'reka-ui';
import { cn } from '@/utils/index';

const props = withDefaults(
  defineProps<
    SeparatorProps & { class?: HTMLAttributes['class']; label?: string }
  >(),
  {
    orientation: 'horizontal',
    decorative: true,
  },
);

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <Separator
    data-slot="separator-root"
    v-bind="delegatedProps"
    :class="
      cn(
        `bg-border relative shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px`,
        props.class,
      )
    "
  >
    <span
      v-if="props.label"
      :class="
        cn(
          'bg-card text-muted-foreground absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs',
          props.orientation === 'vertical'
            ? 'w-px px-1.5 py-2'
            : 'h-px px-2 py-1',
        )
      "
      >{{ props.label }}</span
    >
  </Separator>
</template>
