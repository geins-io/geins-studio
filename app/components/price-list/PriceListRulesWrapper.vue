<script setup lang="ts">
import type { PriceListRuleMode } from '#shared/types';

const props = withDefaults(
  defineProps<{
    title: string;
    modeId: string;
    disabled?: boolean;
    /** Modes no product in the list can use; disabled in the select, with the reason. */
    unavailableModes?: PriceListRuleMode[];
  }>(),
  {
    unavailableModes: () => [],
  },
);

const mode = defineModel<PriceListRuleMode>('mode', { required: true });

const { t } = useI18n();
const modes: PriceListRuleMode[] = ['discount', 'margin'];
const unavailableReasons = computed(() =>
  props.unavailableModes.map((item) =>
    item === 'discount'
      ? t('pricing.price_list_no_product_price')
      : t('pricing.price_list_no_product_purchase_price'),
  ),
);
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
        <Label :for="modeId" class="text-xs">
          {{ $t('pricing.calculate_by') }}
        </Label>
        <Select
          :id="modeId"
          v-model="mode"
          :disabled="disabled"
          class="mb-4 w-28 sm:w-48!"
        >
          <SelectTrigger class="w-28 sm:w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="item in modes"
              :key="item"
              :value="item"
              :disabled="unavailableModes.includes(item)"
            >
              {{ $t(item) }}
            </SelectItem>
            <!-- A disabled item takes no pointer events, so its reason sits below the items. -->
            <p
              v-for="reason in unavailableReasons"
              :key="reason"
              class="text-muted-foreground max-w-56 px-2 py-1.5 text-xs whitespace-normal"
            >
              {{ reason }}
            </p>
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
