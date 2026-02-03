<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
  data: {
    label: string;
    icon: string;
    description?: string;
    config?: {
      duration?: number;
      unit?: 'seconds' | 'minutes' | 'hours' | 'days';
    };
  };
  selected?: boolean;
}

defineProps<Props>();

const formatDuration = (config: Props['data']['config']) => {
  if (!config?.duration || !config?.unit) return null;

  const unitLabels: Record<string, string> = {
    seconds: 's',
    minutes: 'm',
    hours: 'h',
    days: 'd',
  };

  return `Wait: ${config.duration}${unitLabels[config.unit] || config.unit}`;
};
</script>

<template>
  <div
    :class="[
      'relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
      selected
        ? 'border-[hsl(25_95%_53%)] ring-2 ring-[hsl(25_95%_53%)]/30'
        : 'border-[hsl(25_95%_53%)]/60 hover:border-[hsl(25_95%_53%)]',
    ]"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-[hsl(25_95%_53%)] !size-3 !border-2 !border-white"
    />

    <!-- Header with color bar -->
    <div
      class="flex items-center gap-2 rounded-t-md bg-[hsl(25_95%_53%)]/10 px-3 py-2"
    >
      <div
        class="flex size-7 items-center justify-center rounded-md bg-[hsl(25_95%_53%)]"
      >
        <LucideTimer class="size-4 text-white" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium leading-tight">{{ data.label }}</p>
        <p v-if="data.description" class="text-muted-foreground text-xs">
          {{ data.description }}
        </p>
      </div>
    </div>

    <!-- Duration preview -->
    <div
      v-if="formatDuration(data.config)"
      class="text-muted-foreground border-t px-3 py-1.5 font-mono text-xs"
    >
      {{ formatDuration(data.config) }}
    </div>

    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!bg-[hsl(25_95%_53%)] !size-3 !border-2 !border-white"
    />
  </div>
</template>
