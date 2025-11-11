<script setup lang="ts">
import type { PriceListRuleMode } from '#shared/types';

const _props = defineProps<{
  title: string;
  modeId: string;
}>();

const mode = defineModel<PriceListRuleMode>('mode', { required: true });
</script>

<template>
  <div class="rounded-lg border">
    <div
      class="flex items-center border-b px-2 py-1.5 whitespace-nowrap sm:px-4 sm:py-2.5"
    >
      <ContentCardHeader
        size="sm"
        :title="title"
        class="mr-2 border-r pr-2 sm:mr-5 sm:pr-5"
      />
      <div class="flex items-center gap-1 sm:gap-2">
        <Label :for="modeId" class="text-xs"> Calculate by </Label>
        <Select :id="modeId" v-model="mode" class="mb-4 w-28 sm:w-48!">
          <SelectTrigger class="w-28 sm:w-32" size="sm">
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

    <div class="pb-5">
      <div class="flex flex-wrap items-center gap-2 p-4 pb-0">
        <slot />
      </div>
      <div v-auto-animate class="flex px-4 [&>*]:mt-5">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
