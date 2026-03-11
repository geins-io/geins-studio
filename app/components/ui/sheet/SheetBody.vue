<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div
    data-slot="sheet-body"
    :class="cn('overflow-auto p-3 sm:p-6', props.class)"
  >
    <slot />
  </div>
</template>
