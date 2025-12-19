<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { useToast } from '@/components/ui/toast/use-toast';

const props = withDefaults(
  defineProps<{
    rules: PriceListRule[];
    productId: string;
    productName: string;
    priceListId: string;
    currency?: string;
    vatDescription?: string;
  }>(),
  {},
);

const emit = defineEmits<{
  (e: 'save', rules: PriceListRule[]): void;
}>();

const { getPriceListProduct, getNewPriceListProducts } = usePriceListProducts();
const { productApi } = useGeinsRepository();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/wholesale/price-list/[id].vue');

const open = defineModel<boolean>('open');
const propRules = toRef(props, 'rules');
const priceListProducts = defineModel<PriceListProduct[]>('priceListProducts', {
  default: () => [],
});
const rulesValid = ref(true);
const rulesLoading = ref(false);

const globalRules = computed(() => {
  return propRules.value.filter((rule: PriceListRule) => rule.global);
});
const productRules = computed(() => {
  return propRules.value.filter((rule: PriceListRule) => !rule.global) || [];
});

const editableRules = ref<PriceListRule[]>(productRules.value);

watch(propRules, (newRules) => {
  editableRules.value = newRules.filter((rule: PriceListRule) => !rule.global);
});

const handleUpdate = useDebounceFn((rules: PriceListRule[]) => {
  // If the rules array is shorter, it's likely a removal - handle immediately
  if (rules.length < editableRules.value.length) {
    editableRules.value = rules;
    return;
  }
  editableRules.value = rules;
}, 800);

const handleUpdateRule = useDebounceFn(
  async (payload: { index: number; rule: PriceListRule }) => {
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
      const previewPrice = await productApi.priceList
        .id(props.priceListId)
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
  const newRules: (PriceListProduct | undefined)[] = editableRules.value.map(
    (rule) => {
      const valueType = rule.lastFieldChanged || 'price';
      const value = Number(rule[valueType]);

      if (isNaN(value) || !rule.quantity || rule.quantity === 1) {
        return undefined;
      }

      const product = getPriceListProduct(
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

  const filteredNewRules: PriceListProduct[] = newRules.filter(
    (rule) => rule !== undefined,
  );
  priceListProducts.value = getNewPriceListProducts(
    filteredNewRules,
    priceListProducts.value,
    props.productId,
  );

  emit('save', priceListProducts.value);
  open.value = false;
  rulesValid.value = true;
};

const handleRemove = async (rule: PriceListRule) => {
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
        <SheetTitle>{{ $t('wholesale.price_list_volume_pricing') }}</SheetTitle>
        <SheetDescription>
          {{ $t('wholesale.price_list_volume_pricing_sheet_description') }}
          <strong>{{ productName }}</strong>
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <ContentCardHeader
          size="sm"
          :title="$t('wholesale.price_list_global_volume_pricing')"
          :description="
            $t('wholesale.price_list_global_volume_pricing_description')
          "
          class="mb-4"
        />
        <PriceListRules
          v-if="globalRules.length"
          mode="all"
          :rules="globalRules"
          :disabled="true"
          :vat-description="vatDescription"
          :currency="currency"
        />
        <p v-else class="text-muted-foreground text-sm italic">
          {{ $t('wholesale.price_list_no_global_breaks') }}
        </p>
        <ContentCardHeader
          size="sm"
          :title="$t('wholesale.price_list_product_volume_pricing')"
          :description="
            $t('wholesale.price_list_product_volume_pricing_description')
          "
          class="mt-6 mb-4"
        />
        <PriceListRules
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
          <template #title> Check your price breaks and try again </template>
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
