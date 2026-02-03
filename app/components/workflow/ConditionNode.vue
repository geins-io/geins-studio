<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';

interface Props {
  data: {
    label: string;
    icon: string;
    description?: string;
    config?: {
      field?: string;
      operator?: string;
      value?: string;
    };
  };
  selected?: boolean;
}

defineProps<Props>();

const formatCondition = (config: Props['data']['config']) => {
  if (!config?.field || !config?.operator) return null;

  const operatorMap: Record<string, string> = {
    equals: '=',
    not_equals: '≠',
    contains: '∋',
    greater_than: '>',
    less_than: '<',
    is_empty: 'is empty',
    is_not_empty: 'is not empty',
  };

  const op = operatorMap[config.operator] || config.operator;
  const value = config.value || '';

  if (config.operator === 'is_empty' || config.operator === 'is_not_empty') {
    return `${config.field} ${op}`;
  }

  return `${config.field} ${op} ${value}`;
};
</script>

<template>
  <div
    :class="[
      'relative min-w-[180px] rounded-lg border-2 bg-card shadow-md transition-all',
      selected
        ? 'border-[hsl(48_96%_53%)] ring-2 ring-[hsl(48_96%_53%)]/30'
        : 'border-[hsl(48_96%_53%)]/60 hover:border-[hsl(48_96%_53%)]',
    ]"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!bg-[hsl(48_96%_53%)] !size-3 !border-2 !border-white"
    />

    <!-- Header with color bar -->
    <div
      class="flex items-center gap-2 rounded-t-md bg-[hsl(48_96%_53%)]/10 px-3 py-2"
    >
      <div
        class="flex size-7 items-center justify-center rounded-md bg-[hsl(48_96%_53%)]"
      >
        <LucideGitBranch class="size-4 text-white" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium leading-tight">{{ data.label }}</p>
        <p v-if="data.description" class="text-muted-foreground text-xs">
          {{ data.description }}
        </p>
      </div>
    </div>

    <!-- Condition preview -->
    <div
      v-if="formatCondition(data.config)"
      class="text-muted-foreground border-t px-3 py-1.5 font-mono text-xs"
    >
      {{ formatCondition(data.config) }}
    </div>

    <!-- Output handles with labels -->
    <div class="relative">
      <!-- True output -->
      <Handle
        id="true"
        type="source"
        :position="Position.Right"
        :style="{ top: '-12px' }"
        class="!size-3 !border-2 !border-white !bg-[hsl(142_76%_36%)]"
      />
      <span
        class="absolute top-[-18px] right-5 text-xs font-medium text-[hsl(142_76%_36%)]"
        >Yes</span
      >

      <!-- False output -->
      <Handle
        id="false"
        type="source"
        :position="Position.Right"
        :style="{ top: '12px' }"
        class="!size-3 !border-2 !border-white !bg-[hsl(0_80%_58%)]"
      />
      <span
        class="absolute top-[6px] right-5 text-xs font-medium text-[hsl(0_80%_58%)]"
        >No</span
      >
    </div>
  </div>
</template>
