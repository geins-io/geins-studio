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
    /** View-only: the product's price breaks, no inputs, Close-only footer. */
    readonly?: boolean;
    /** Read-only header values (price, list price, margin) for the product. */
    product?: PriceListProductList;
    /** Label for the product's list price in the read-only header. */
    listPriceTitle?: string;
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
const { geinsLogError } = useGeinsLog(
  'components/price-list/PriceListVolumePricingPanel.vue',
);

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

const withVat = (label: string) =>
  props.vatDescription ? `${label} (${props.vatDescription})` : label;
const readonlySummary = computed(() => {
  if (!props.product) return [];
  const { regularPrice, listPrice, margin } = props.product;
  return [
    { label: withVat(t('price')), ...regularPrice },
    {
      label: withVat(props.listPriceTitle || t('pricing.price_list_price')),
      ...(listPrice ?? { currency: props.currency || '' }),
    },
    { label: t('margin'), price: String(margin ?? ''), currency: '%' },
  ];
});

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
      // Read-style POST with its own error toast below — opt out of the global
      // toast to avoid a double.
      const previewPrice = await productApi.priceList
        .id(props.priceListId)
        .previewPrice(previewProduct, { suppressErrorToast: true });

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

const readonlyCellClasses = 'px-4 py-2.5 text-left font-normal';

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
        <SheetTitle>{{ $t('pricing.price_list_volume_pricing') }}</SheetTitle>
        <SheetDescription>
          {{
            readonly
              ? $t('pricing.price_list_volume_pricing_readonly_description')
              : $t('pricing.price_list_volume_pricing_sheet_description')
          }}
          <strong>{{ productName }}</strong>
        </SheetDescription>
      </SheetHeader>
      <SheetBody v-if="readonly">
        <div v-if="readonlySummary.length" class="mb-6 grid grid-cols-3 gap-4">
          <div v-for="item in readonlySummary" :key="item.label">
            <p class="text-muted-foreground mb-1 text-xs">{{ item.label }}</p>
            <TableCellCurrency
              :price="item.price"
              :currency="item.currency"
              class="text-xs"
            />
          </div>
        </div>
        <ContentCardHeader
          size="sm"
          :title="$t('pricing.price_list_product_volume_pricing')"
          :description="$t('pricing.company_volume_pricing_description')"
          class="mb-4"
        />
        <div class="overflow-hidden rounded-lg border">
          <table class="w-full text-xs">
            <thead class="bg-background">
              <tr class="border-b">
                <th :class="readonlyCellClasses">{{ $t('quantity') }}</th>
                <th :class="readonlyCellClasses">{{ withVat($t('price')) }}</th>
                <th :class="readonlyCellClasses">{{ $t('discount') }}</th>
                <th :class="readonlyCellClasses">{{ $t('margin') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rule in rules"
                :key="rule.quantity"
                class="border-b last:border-0"
              >
                <td :class="cn(readonlyCellClasses, 'tabular-nums')">
                  {{ rule.quantity }}+
                </td>
                <td :class="readonlyCellClasses">
                  <TableCellCurrency
                    :price="String(rule.price ?? '')"
                    :currency="currency || ''"
                  />
                </td>
                <td :class="readonlyCellClasses">
                  <TableCellCurrency
                    :price="String(rule.discountPercent ?? '')"
                    currency="%"
                  />
                </td>
                <td :class="readonlyCellClasses">
                  <TableCellCurrency
                    :price="String(rule.margin ?? '')"
                    currency="%"
                  />
                </td>
              </tr>
              <tr v-if="!rules.length">
                <td
                  colspan="4"
                  class="text-muted-foreground px-4 py-6 text-center"
                >
                  {{ $t('pricing.price_list_no_product_breaks') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SheetBody>
      <SheetBody v-else>
        <ContentCardHeader
          size="sm"
          :title="$t('pricing.price_list_global_volume_pricing')"
          :description="
            $t('pricing.price_list_global_volume_pricing_description')
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
          {{ $t('pricing.price_list_no_global_breaks') }}
        </p>
        <ContentCardHeader
          size="sm"
          :title="$t('pricing.price_list_product_volume_pricing')"
          :description="
            $t('pricing.price_list_product_volume_pricing_description')
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
          v-if="!rulesValid"
          v-auto-animate
          type="negative"
          class="mt-10"
        >
          <template #title>Check your price breaks and try again</template>
          <template #description>
            Quantity must be more than 1 and at least one value must be present
          </template>
        </Feedback>
      </SheetBody>
      <SheetFooter v-if="readonly">
        <Button variant="outline" @click="open = false">
          {{ $t('close') }}
        </Button>
      </SheetFooter>
      <SheetFooter v-else>
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
