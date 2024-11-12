<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <th
    :class="
      cn(
        'font-medium [&:first-child]:rounded-tl-lg [&:last-child]:rounded-tr-lg [&:not(:last-child)]:border-r',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
