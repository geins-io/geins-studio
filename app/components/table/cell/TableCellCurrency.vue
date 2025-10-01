<script setup lang="ts">
import type { Price } from '#shared/types';
const props = defineProps<Price>();
const currency = toRef(props, 'currency');
const price = toRef(props, 'price');
</script>
<template>
  <div>
    <div class="flex items-center">
      <span :class="cn('mr-2 border-r pr-2 text-xs text-muted-foreground')">
        {{ currency }}
      </span>
      <span class="size-full rounded-lg bg-transparent text-xs">
        {{ price }}
      </span>
    </div>
  </div>
</template>
