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
        'border-l p-0 font-semibold [&:first-child]:rounded-tl-lg [&:first-child]:border-0 [&:last-child]:rounded-tr-lg',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
