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
        'h-12 px-1.5 text-left align-middle font-medium [&:first-child]:rounded-tl-lg [&:last-child]:rounded-tr-lg [&:not(:last-child)]:border-r [&>[role=checkbox]]:mx-2 [&>[role=checkbox]]:translate-y-0.5',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
