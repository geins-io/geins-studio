<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    rules: PricelistRule[];
    productId: string;
    currency?: string;
    vatDescription?: string;
  }>(),
  {},
);

const emit = defineEmits<{
  (e: 'save', rules: PricelistRule[]): void;
}>();

const { $geinsApi } = useNuxtApp();
const { getPricelistProduct, addToPricelistProducts } = usePricelistProducts();
const productApi = repo.product($geinsApi);

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

const editableRules = ref<PricelistRule[]>(productRules.value);

watch(propRules, (newRules) => {
  editableRules.value = newRules.filter((rule: PricelistRule) => !rule.global);
});

const handleUpdate = useDebounceFn((rules: PricelistRule[]) => {
  editableRules.value = rules;
}, 700);

const handleCancel = () => {
  open.value = false;
  rulesValid.value = true;
};
const handleSave = () => {
  rulesValid.value = true;
  editableRules.value.forEach((rule) => {
    const valueType = rule.lastFieldChanged || 'price';
    const value = Number(rule[valueType]);

    if (isNaN(value) || !rule.quantity || rule.quantity === 1) {
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
  });
  if (!rulesValid.value) {
    return;
  }
  emit('save', editableRules.value);
  open.value = false;
  rulesValid.value = true;
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
          mode="all"
          :rules="globalRules"
          :disabled="true"
          :vat-description="props.vatDescription"
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
          :vat-description="props.vatDescription"
          :currency="currency"
          @update="handleUpdate"
        />
        <Feedback
          v-auto-animate
          v-if="!rulesValid"
          type="negative"
          class="mt-10"
        >
          <template #title> Check your quantity levels and try again </template>
          <template #description>
            Quantity must be more than 1 and at least one value must be present
          </template>
        </Feedback>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('cancel') }}
        </Button>
        <Button @click.stop="handleSave">
          {{ $t('apply') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
