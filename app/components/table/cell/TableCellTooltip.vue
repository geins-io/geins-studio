<script setup lang="ts">
import type { Tooltip } from '#shared/types';
const _props = defineProps<Tooltip>();
</script>
<template>
  <div>
    <ContentTextTooltip v-if="!disabled">
      {{ displayValue }}
      <template #tooltip>
        {{ contentValue }}
      </template>
    </ContentTextTooltip>
    <span v-else class="text-muted-foreground">
      {{ displayValue }}
    </span>
  </div>
</template>
