<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
  data: {
    label: string;
    icon: string;
    description?: string;
    config?: Record<string, any>;
  };
  selected?: boolean;
}

defineProps<Props>();

const getIconName = (icon: string) => {
  const iconMap: Record<string, string> = {
    webhook: 'LucideWebhook',
    schedule: 'LucideClock',
    manual: 'LucidePlay',
    email: 'LucideMail',
    form: 'LucideFileInput',
    api: 'LucideCode',
  };
  return iconMap[icon] || 'LucideZap';
};

const formatConfig = (config: Record<string, any> | undefined) => {
  if (!config) return null;
  if (config.path) return `/${config.path}`;
  if (config.schedule) return config.schedule;
  return null;
};
</script>

<template>
  <div
    :class="[
      'relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
      selected
        ? 'border-[hsl(142_76%_36%)] ring-2 ring-[hsl(142_76%_36%)]/30'
        : 'border-[hsl(142_76%_36%)]/60 hover:border-[hsl(142_76%_36%)]',
    ]"
  >
    <!-- Header with color bar -->
    <div
      class="flex items-center gap-2 rounded-t-md bg-[hsl(142_76%_36%)]/10 px-3 py-2"
    >
      <div
        class="flex size-7 items-center justify-center rounded-md bg-[hsl(142_76%_36%)]"
      >
        <component :is="getIconName(data.icon)" class="size-4 text-white" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium leading-tight">{{ data.label }}</p>
        <p v-if="data.description" class="text-muted-foreground text-xs">
          {{ data.description }}
        </p>
      </div>
    </div>

    <!-- Config preview -->
    <div
      v-if="formatConfig(data.config)"
      class="text-muted-foreground border-t px-3 py-1.5 font-mono text-xs"
    >
      {{ formatConfig(data.config) }}
    </div>

    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!bg-[hsl(142_76%_36%)] !size-3 !border-2 !border-white"
    />
  </div>
</template>
