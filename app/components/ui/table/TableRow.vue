<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tr
    :class="
      cn(
        'border-b transition-colors hover:bg-muted/20 data-[state=selected]:bg-muted/30',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
