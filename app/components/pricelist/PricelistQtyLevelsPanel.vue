<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    rules: PricelistRule[];
    productId: string;
    currency?: string;
    exVat?: boolean;
  }>(),
  {},
);

const { getPricelistProduct, addToPricelistProducts } = usePricelistProducts();

const open = defineModel<boolean>('open');
const propRules = toRef(props, 'rules');
const pricelistProducts = defineModel<PricelistProduct[]>('pricelistProducts', {
  default: () => [],
});
const rulesValid = ref(true);

const globalRules = computed(() => {
  return propRules.value.filter((rule: PricelistRule) => rule.global);
});
const productRules = computed(() => {
  return propRules.value.filter((rule: PricelistRule) => !rule.global) || [];
});

const editableRules = ref<PricelistRule[]>(structuredClone(productRules.value));

watch(propRules, (newRules) => {
  editableRules.value = newRules.filter((rule: PricelistRule) => !rule.global);
});

const emit = defineEmits<{
  (e: 'save', rules: PricelistRule[]): void;
}>();

const handleUpdate = useDebounceFn((rules: PricelistRule[]) => {
  editableRules.value = rules;
}, 700);

const handleCancel = () => {
  open.value = false;
};
const handleSave = () => {
  rulesValid.value = true;
  editableRules.value.forEach((rule) => {
    const valueType = rule.lastFieldChanged || 'price';
    const value = Number(rule[valueType]);

    if (isNaN(value) || rule.quantity === 1) {
      rulesValid.value = false;
      return;
    }

    const product = getPricelistProduct(
      props.productId,
      value,
      valueType,
      rule.quantity,
    );
    addToPricelistProducts(product, pricelistProducts.value);
    console.log(
      '🚀 ~ SAVED NEW PRODUCT LEVELS TO PRICELIST',
      pricelistProducts.value,
    );
  });
  emit('save', editableRules.value);
  open.value = false;
};
</script>
<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Quantity levels</SheetTitle>
        <SheetDescription>
          Add quantity based price levels for this product.
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <ContentCardHeader
          size="sm"
          title="Global quantity levels"
          description="These price levels are applied globally to all products"
          class="mb-4"
        />
        <PricelistRules
          v-if="globalRules.length"
          :rules="globalRules"
          :disabled="true"
          mode="all"
          :currency="currency"
        />
        <p v-else class="text-muted-foreground text-sm italic">
          No global quantity levels defined.
        </p>
        <ContentCardHeader
          size="sm"
          title="Product quantity levels"
          description="These price levels are applied only to this product. If you add a level with the same quantity as a global level, the global price level will be overridden."
          class="mt-6 mb-4"
        />
        <PricelistRules
          mode="all"
          :rules="editableRules"
          :product-id="props.productId"
          :ex-vat="props.exVat"
          :currency="currency"
          @update="handleUpdate"
        />
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('cancel') }}
        </Button>
        <Button @click.stop="handleSave"> {{ $t('apply') }} </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
