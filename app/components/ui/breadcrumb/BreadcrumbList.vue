<script lang="ts" setup>
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/index';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <ol
    data-slot="breadcrumb-list"
    :class="
      cn(
        'text-muted-foreground flex w-full flex-wrap items-center gap-0.5 text-sm break-words sm:gap-2.5',
        props.class,
      )
    "
  >
    <slot />
  </ol>
</template>
