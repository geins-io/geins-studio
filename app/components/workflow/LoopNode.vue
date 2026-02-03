<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
  data: {
    label: string;
    icon: string;
    description?: string;
    config?: {
      itemsField?: string;
      batchSize?: number;
    };
  };
  selected?: boolean;
}

defineProps<Props>();

const formatConfig = (config: Props['data']['config']) => {
  if (!config?.itemsField) return null;
  const batch = config.batchSize ? ` (batch: ${config.batchSize})` : '';
  return `${config.itemsField}${batch}`;
};
</script>

<template>
  <div
    :class="[
      'relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
      selected
        ? 'border-[hsl(280_67%_60%)] ring-2 ring-[hsl(280_67%_60%)]/30'
        : 'border-[hsl(280_67%_60%)]/60 hover:border-[hsl(280_67%_60%)]',
    ]"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-[hsl(280_67%_60%)] !size-3 !border-2 !border-white"
    />

    <!-- Header with color bar -->
    <div
      class="flex items-center gap-2 rounded-t-md bg-[hsl(280_67%_60%)]/10 px-3 py-2"
    >
      <div
        class="flex size-7 items-center justify-center rounded-md bg-[hsl(280_67%_60%)]"
      >
        <LucideRepeat class="size-4 text-white" />
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

    <!-- Output handles with labels -->
    <div class="relative">
      <!-- Loop output (each iteration) -->
      <Handle
        id="loop"
        type="source"
        :position="Position.Right"
        :style="{ top: '-12px' }"
        class="!bg-[hsl(280_67%_60%)] !size-3 !border-2 !border-white"
      />
      <span
        class="text-muted-foreground absolute top-[-18px] right-5 text-xs font-medium"
        >Each</span
      >

      <!-- Done output (completion) -->
      <Handle
        id="done"
        type="source"
        :position="Position.Right"
        :style="{ top: '12px' }"
        class="!size-3 !border-2 !border-white !bg-[hsl(142_76%_36%)]"
      />
      <span
        class="absolute top-[6px] right-5 text-xs font-medium text-[hsl(142_76%_36%)]"
        >Done</span
      >
    </div>
  </div>
</template>
