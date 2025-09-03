<script setup lang="ts">
import type { PricelistRuleMode } from '#shared/types';

const _props = defineProps<{
  title: string;
  modeId: string;
}>();

const mode = defineModel<PricelistRuleMode>('mode', { required: true });
</script>

<template>
  <div class="rounded-lg border">
    <div class="flex items-center border-b px-4 py-2.5">
      <ContentCardHeader size="sm" :title="title" class="mr-8 border-r pr-8" />
      <div class="flex items-center gap-2">
        <Label :for="modeId" class="text-xs"> Calculate by </Label>
        <Select :id="modeId" v-model="mode" class="mb-4 w-48!">
          <SelectTrigger class="w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="item in ['discount', 'margin']"
              :key="item"
              :value="item"
            >
              {{ $t(item) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 p-4">
      <slot />
    </div>
  </div>
</template>
