<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<SkeletonProps>();
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn('bg-background animate-pulse rounded-xl', props.class)"
  />
</template>
