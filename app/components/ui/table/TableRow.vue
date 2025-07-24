<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tr
    data-slot="table-row"
    :class="
      cn(
        'hover:bg-muted/20 data-[state=selected]:bg-muted/30 border-b transition-colors [:last-child>td]:after:hidden',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
