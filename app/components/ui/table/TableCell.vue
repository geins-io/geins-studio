<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/index';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <td
    data-slot="table-cell"
    :class="
      cn(
        'border-l p-0 align-middle whitespace-nowrap first:border-0 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
