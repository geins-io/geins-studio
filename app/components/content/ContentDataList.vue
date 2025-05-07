<script setup lang="ts">
import { DataItemDisplayType } from '#shared/types';

const _props = withDefaults(
  defineProps<{
    dataList?: DataItem[];
  }>(),
  {
    dataList: () => [],
  },
);
</script>
<template>
  <ul v-auto-animate class="space-y-3 border-t pt-4 text-sm">
    <li
      v-for="(item, index) in dataList"
      :key="index"
      class="flex items-center justify-between gap-2 text-right text-muted-foreground"
    >
      <span class="text-left font-bold text-foreground">{{ item.label }}:</span>
      <div
        v-if="
          Array.isArray(item.value) &&
          item.displayType === DataItemDisplayType.ArraySummary
        "
      >
        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger>
              <span
                class="underline decoration-muted-foreground decoration-dashed decoration-1 underline-offset-4"
              >
                {{
                  $t(
                    'nr_of_entity',
                    { count: item.value.length, entityName: item.entityName },
                    item.value.length,
                  )
                }}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ item.displayValue }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span v-else>{{ item.value }}</span>
    </li>
  </ul>
</template>
