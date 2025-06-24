<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    mode: 'margin' | 'discount' | 'price';
    index: number;
    global?: boolean;
    currency?: string;
  }>(),
  {
    mode: 'margin',
  },
);
const quantity = defineModel<number>('quantity');
const margin = defineModel<number | undefined>('margin');
const discount = defineModel<number | undefined>('discount');
const price = defineModel<number | undefined>('price');
const applied = defineModel<boolean>('applied');

const initialQuantity = quantity.value;
const initialMargin = margin.value;
const initialDiscount = discount.value;
const currency = ref(props.currency ?? 'XXX');

const _emit = defineEmits<{
  (
    e: 'update:quantity' | 'update:margin' | 'update:discount' | 'update:price',
    payload: number,
  ): void;
  (e: 'apply' | 'applyAndOverwrite' | 'remove'): void;
}>();

watch(
  () => props.mode,
  (newMode) => {
    if (newMode === 'margin') {
      discount.value = initialDiscount;
    } else {
      margin.value = initialMargin;
    }
    applied.value = false;
  },
);

watch(
  () => [quantity.value, margin.value, discount.value],
  ([newQuantity, newMargin, newDiscount]) => {
    applied.value =
      newQuantity === initialQuantity &&
      newMargin === initialMargin &&
      newDiscount === initialDiscount;
  },
);

const tdClasses = 'text-xs text-left py-3 pr-5';
</script>
<template>
  <tr class="border-b first:border-t">
    <td :class="tdClasses">
      <Input
        v-model.number="quantity"
        size="sm"
        :disabled="index === 0 && quantity === 1"
      />
    </td>
    <td v-if="mode === 'margin'" :class="tdClasses">
      <Input v-model.number="margin" size="sm" placeholder="0">
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td v-if="mode === 'discount'" :class="tdClasses">
      <Input v-model.number="discount" size="sm" placeholder="0">
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td v-if="mode === 'price'" :class="tdClasses">
      <Input v-model.number="price" size="sm" placeholder="0">
        <template #valueDescriptor>{{ currency }}</template>
      </Input>
    </td>

    <td v-else :class="cn(tdClasses, 'text-center')">
      <LucideCircleCheck v-if="applied" class="mx-auto size-4 text-positive" />
      <LucideCircleDashed v-else class="mx-auto size-4 text-foreground/30" />
    </td>
    <td class="flex items-center justify-end gap-2 py-3">
      <Button
        v-if="props.mode !== 'price'"
        size="xs"
        variant="outline"
        @click="$emit('apply')"
        >Apply</Button
      >
      <Button
        v-if="props.mode !== 'price'"
        size="xs"
        variant="outline"
        @click="$emit('applyAndOverwrite')"
        >Apply and overwrite</Button
      >
      <Button
        :disabled="(index === 0 && quantity === 1) || global"
        size="icon"
        variant="outline"
        class="size-7 hover:text-destructive"
        @click="$emit('remove')"
      >
        <LucideX class="size-3.5" />
      </Button>
    </td>
  </tr>
</template>
