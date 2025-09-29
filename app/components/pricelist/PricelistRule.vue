<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    mode: 'margin' | 'discount' | 'all';
    index: number;
    currency?: string;
    loading?: boolean;
    lastFieldChanged?: PricelistRuleField;
    global?: boolean;
  }>(),
  {
    mode: 'margin',
  },
);
const quantity = defineModel<number | undefined>('quantity');
const margin = defineModel<number | undefined>('margin');
const discount = defineModel<number | undefined>('discount');
const price = defineModel<number | undefined>('price');
const applied = defineModel<boolean>('applied');

const loading = toRef(props, 'loading');

const initialQuantity = quantity.value;
const initialMargin = margin.value;
const initialDiscount = discount.value;
const currency = ref(props.currency ?? 'XXX');

const emit = defineEmits<{
  (
    e: 'update:quantity' | 'update:margin' | 'update:discount' | 'update:price',
    payload: number,
  ): void;
  (e: 'apply' | 'apply-overwrite' | 'remove'): void;
}>();

watch(
  () => [quantity.value, margin.value, discount.value],
  ([newQuantity, newMargin, newDiscount]) => {
    applied.value =
      newQuantity === initialQuantity &&
      newMargin === initialMargin &&
      newDiscount === initialDiscount;
  },
);

const quantityBlurred = ref(false);
const quantityValid = computed(() => {
  if (!quantityBlurred.value) return true;
  return !!quantity.value && quantity.value > 1;
});

const ruleValid = computed(() => {
  if (props.mode === 'margin') {
    return margin.value !== undefined && quantityValid.value;
  }
  if (props.mode === 'discount') {
    return discount.value !== undefined && quantityValid.value;
  }
  return false;
});

const tdClasses = 'text-xs text-left py-3 pr-5';

const handleApply = (overwrite: boolean) => {
  emit(overwrite ? 'apply-overwrite' : 'apply');
};
</script>
<template>
  <tr class="border-b first:border-t">
    <td :class="tdClasses">
      <Input
        v-model.number="quantity"
        type="number"
        size="sm"
        class="min-w-14"
        :disabled="global && mode === 'all'"
        :valid="quantityValid"
        @blur="quantityBlurred = true"
      />
    </td>
    <td v-if="mode === 'margin' || mode === 'all'" :class="tdClasses">
      <Input
        v-model.number="margin"
        size="sm"
        placeholder="0"
        class="min-w-20"
        :loading="loading && lastFieldChanged !== 'margin' && mode === 'all'"
        :disabled="global && mode === 'all'"
      >
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td v-if="mode === 'discount' || mode === 'all'" :class="tdClasses">
      <Input
        v-model.number="discount"
        size="sm"
        placeholder="0"
        class="min-w-20"
        :loading="
          loading && lastFieldChanged !== 'discountPercent' && mode === 'all'
        "
        :disabled="global && mode === 'all'"
      >
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td v-if="mode === 'all'" :class="tdClasses">
      <Input
        v-model.number="price"
        size="sm"
        placeholder="0"
        class="min-w-20"
        :loading="loading && lastFieldChanged !== 'price' && mode === 'all'"
        :disabled="global && mode === 'all'"
      >
        <template #valueDescriptor>{{ currency }}</template>
      </Input>
    </td>

    <td v-else :class="cn(tdClasses, 'text-center')">
      <LucideLoaderCircle v-if="loading" class="size-4 animate-spin" />
      <LucideCircleCheck v-else-if="applied" class="text-positive size-4" />
      <LucideCircleDashed v-else class="text-foreground/30 size-4" />
    </td>
    <td class="flex items-center justify-end gap-2 py-3">
      <Button
        v-if="props.mode !== 'all'"
        :disabled="applied || quantity === undefined || !ruleValid"
        size="xs"
        variant="outline"
        @click="handleApply(false)"
        >{{ $t('apply') }}</Button
      >
      <Button
        v-if="props.mode !== 'all'"
        :disabled="quantity === undefined || !ruleValid"
        size="xs"
        variant="outline"
        @click="handleApply(true)"
        >{{ $t('wholesale.pricelist_apply_overwrite') }}</Button
      >
      <Button
        :disabled="global && mode === 'all'"
        size="xs"
        variant="outline"
        class="hover:text-destructive size-7"
        @click="$emit('remove')"
      >
        <LucideX class="size-6" />
      </Button>
    </td>
  </tr>
</template>
