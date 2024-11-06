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
        'p-1.5 align-middle text-xs leading-8 [&:not(:last-child)]:border-r [&>[role=checkbox]]:mx-2 [&>[role=checkbox]]:translate-y-0.5',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
