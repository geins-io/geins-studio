<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <p
    data-slot="item-description"
    :class="
      cn(
        'text-muted-foreground line-clamp-2 text-xs leading-normal font-normal text-balance sm:mt-1',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
        props.class,
      )
    "
  >
    <slot />
  </p>
</template>
