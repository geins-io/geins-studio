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
    http: 'LucideGlobe',
    email: 'LucideMail',
    slack: 'LucideMessageSquare',
    discord: 'LucideMessageCircle',
    database: 'LucideDatabase',
    transform: 'LucideWand2',
    code: 'LucideCode',
    filter: 'LucideFilter',
    notification: 'LucideBell',
    webhook: 'LucideWebhook',
  };
  return iconMap[icon] || 'LucideCircle';
};

const formatConfig = (config: Record<string, any> | undefined) => {
  if (!config) return null;
  if (config.url) return config.url;
  if (config.to) return `To: ${config.to}`;
  if (config.channel) return `#${config.channel}`;
  return null;
};
</script>

<template>
  <div
    :class="[
      'relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
      selected
        ? 'border-[hsl(217_91%_60%)] ring-2 ring-[hsl(217_91%_60%)]/30'
        : 'border-[hsl(217_91%_60%)]/60 hover:border-[hsl(217_91%_60%)]',
    ]"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-[hsl(217_91%_60%)] !size-3 !border-2 !border-white"
    />

    <!-- Header with color bar -->
    <div
      class="flex items-center gap-2 rounded-t-md bg-[hsl(217_91%_60%)]/10 px-3 py-2"
    >
      <div
        class="flex size-7 items-center justify-center rounded-md bg-[hsl(217_91%_60%)]"
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
      class="!bg-[hsl(217_91%_60%)] !size-3 !border-2 !border-white"
    />
  </div>
</template>
