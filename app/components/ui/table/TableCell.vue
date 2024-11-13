<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <td
    :class="
      cn(
        'border-l p-0 [&:first-child]:border-0 [&:last-child]:border-0 [&:nth-child(2)]:border-card',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
