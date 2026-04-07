<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="item-title"
    :class="
      cn(
        'text-primary flex w-fit items-center gap-2 text-sm leading-snug font-bold',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
