<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/index';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tfoot
    data-slot="table-footer"
    :class="
      cn(
        'bg-muted/50 rounded-b-lg border-t font-semibold [&>tr]:last:border-b-0',
        props.class,
      )
    "
  >
    <slot />
  </tfoot>
</template>
