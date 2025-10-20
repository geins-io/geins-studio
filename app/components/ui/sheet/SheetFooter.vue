<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/index';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div
    data-slot="sheet-footer"
    :class="cn('mt-auto flex justify-between gap-2 border-t p-4', props.class)"
  >
    <slot />
  </div>
</template>
