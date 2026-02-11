<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tr
    data-slot="table-row"
    :class="
      cn(
        'hover:bg-muted/20 data-[state=selected]:bg-muted/50 data-[is-child=true]:bg-muted/20 data-[is-child=true]:>td>div:h-6 border-b transition-colors [:last-child>td]:after:hidden',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
