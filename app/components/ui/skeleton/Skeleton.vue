<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

interface SkeletonProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<SkeletonProps>();
</script>

<template>
  <div :class="cn('animate-pulse rounded-xl bg-background', props.class)" />
</template>
