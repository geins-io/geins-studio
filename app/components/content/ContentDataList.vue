<script setup lang="ts">
import { DataItemDisplayType } from '#shared/types';

const _props = withDefaults(
  defineProps<{
    dataList?: DataItem[];
    label?: string;
  }>(),
  {
    dataList: () => [],
    label: '',
  },
);
</script>
<template>
  <div>
    <Separator class="my-5" :label="label" />
    <ul v-auto-animate class="space-y-3 text-sm">
      <li
        v-for="(item, index) in dataList"
        :key="index"
        class="text-muted-foreground flex items-center justify-between gap-2 text-right text-xs sm:text-sm"
      >
        <span class="text-foreground text-left font-bold"
          >{{ item.label }}:</span
        >

        <ContentTextTooltip
          v-if="
            Array.isArray(item.value) &&
            item.displayType === DataItemDisplayType.Array
          "
        >
          {{
            $t(
              'nr_of_entity',
              { count: item.value.length, entityName: item.entityName },
              item.value.length,
            )
          }}
          <template #tooltip>
            {{ item.displayValue }}
          </template>
        </ContentTextTooltip>
        <ContentTextCopy
          v-else-if="item.displayType === DataItemDisplayType.Copy"
          :label="item.label"
          :value="item.value"
        >
          {{ item.displayValue || item.value }}
        </ContentTextCopy>
        <span v-else>{{ item.value }}</span>
      </li>
    </ul>
  </div>
</template>
