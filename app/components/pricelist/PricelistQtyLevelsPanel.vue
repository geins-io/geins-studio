<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { useToast } from '@/components/ui/toast/use-toast';

const props = withDefaults(
  defineProps<{
    rules: PricelistRule[];
    productId: string;
    productName: string;
    pricelistId: string;
    currency?: string;
    vatDescription?: string;
  }>(),
  {},
);

const emit = defineEmits<{
  (e: 'save', rules: PricelistRule[]): void;
}>();

const { getPricelistProduct, getNewPricelistProducts } = usePricelistProducts();
const { productApi } = useGeinsRepository();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/wholesale/pricelist/[id].vue');

const open = defineModel<boolean>('open');
const propRules = toRef(props, 'rules');
const pricelistProducts = defineModel<PricelistProduct[]>('pricelistProducts', {
  default: () => [],
});
const rulesValid = ref(true);
const rulesLoading = ref(false);

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
  // If the rules array is shorter, it's likely a removal - handle immediately
  if (rules.length < editableRules.value.length) {
    editableRules.value = rules;
    return;
  }
  editableRules.value = rules;
}, 800);

const handleUpdateRule = useDebounceFn(
  async (payload: { index: number; rule: PricelistRule }) => {
    try {
      rulesLoading.value = true;
      const valueType = payload.rule.lastFieldChanged || 'price';
      const value = payload.rule[valueType];
      const previewProduct = {
        productId: props.productId,
        ...(valueType === 'price' && { price: value }),
        ...(valueType === 'margin' && { margin: value }),
        ...(valueType === 'discountPercent' && { discountPercent: value }),
      };
      const previewPrice = await productApi.pricelist
        .id(props.pricelistId)
        .previewPrice(previewProduct);

      // Create a new array to ensure reactivity
      const updatedRules = [...editableRules.value];
      updatedRules[payload.index] = {
        ...updatedRules[payload.index],
        margin: previewPrice.margin,
        discountPercent: previewPrice.discountPercent,
        price: previewPrice.price,
      };
      editableRules.value = updatedRules;
    } catch (error) {
      geinsLogError('error fetching preview price', error);
      toast({
        title: t('feedback_error'),
        description: t('feedback_error_description'),
        variant: 'negative',
      });
    } finally {
      rulesLoading.value = false;
    }
  },
  800,
);

const handleCancel = () => {
  open.value = false;
  rulesValid.value = true;
};
const handleSave = () => {
  rulesValid.value = true;
  const newRules: (PricelistProduct | undefined)[] = editableRules.value.map(
    (rule) => {
      const valueType = rule.lastFieldChanged || 'price';
      const value = Number(rule[valueType]);

      if (isNaN(value) || !rule.quantity || rule.quantity === 1) {
        return undefined;
      }

      const product = getPricelistProduct(
        props.productId,
        value,
        valueType,
        rule.quantity,
      );
      return product;
    },
  );

  if (newRules.includes(undefined)) {
    rulesValid.value = false;
    return;
  }

  const filteredNewRules: PricelistProduct[] = newRules.filter(
    (rule) => rule !== undefined,
  );
  pricelistProducts.value = getNewPricelistProducts(
    filteredNewRules,
    pricelistProducts.value,
    props.productId,
  );

  emit('save', pricelistProducts.value);
  open.value = false;
  rulesValid.value = true;
};

const handleRemove = async (rule: PricelistRule) => {
  const index = editableRules.value.findIndex(
    (r) =>
      r.quantity === rule.quantity &&
      r[rule.lastFieldChanged || 'price'] ===
        rule[rule.lastFieldChanged || 'price'],
  );
  if (index === -1) return;

  // Create a new array to ensure reactivity
  editableRules.value = [
    ...editableRules.value.slice(0, index),
    ...editableRules.value.slice(index + 1),
  ];
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
          Add quantity based price levels for <strong>{{ productName }}</strong>
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
          :vat-description="vatDescription"
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
          v-model:loading="rulesLoading"
          mode="all"
          :show-loading="true"
          :rules="editableRules"
          :product-id="productId"
          :vat-description="vatDescription"
          :currency="currency"
          @update-rule="handleUpdateRule"
          @update="handleUpdate"
          @remove="handleRemove"
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
