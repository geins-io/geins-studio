<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tfoot
    :class="
      cn(
        'rounded-b-lg border-t bg-muted/50 font-semibold last:[&>tr]:border-b-0',
        props.class,
      )
    "
  >
    <slot />
  </tfoot>
</template>
