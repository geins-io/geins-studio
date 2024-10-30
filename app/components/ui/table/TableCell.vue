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
        'p-2 align-middle leading-8 [&:has([role=checkbox])]:pr-0 [&:not(:last-child)]:border-r [&>[role=checkbox]]:translate-y-0.5',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
