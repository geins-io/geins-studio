import type {
  PriceListProduct,
  PriceListProductList,
  ProductPriceListUpdate,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UsePriceListPreviewOptions {
  entityId: Ref<string | null>;
  entityDataUpdate: Ref<ProductPriceListUpdate>;
  transformProductsForList: (
    priceListProducts: PriceListProduct[],
    entityData: ProductPriceListUpdate,
  ) => PriceListProductList[];
  setupColumns: () => void;
  onUpdateProducts: (editedProducts: PriceListProduct[]) => Promise<void>;
  convertPriceModeToRuleField: (
    priceMode?: PriceListPriceMode,
  ) => PriceListRuleField | undefined;
  getPriceListProduct: (
    productId: string,
    value: number | null,
    priceMode: PriceListRuleField | undefined,
    staggeredCount: number,
  ) => PriceListProduct;
}

export interface UsePriceListPreviewReturnType {
  // State
  priceListProducts: Ref<PriceListProduct[]>;
  selectedProducts: Ref<PriceListProductList[]>;
  updateInProgress: Ref<boolean>;
  hasProductSelection: ComputedRef<boolean>;

  // Methods
  previewPriceList: (
    feedbackMessage?: string,
    updateProducts?: boolean,
    showFeedback?: boolean,
  ) => Promise<void>;
}

/**
 * Composable for managing priceList preview functionality and product state
 */
export function usePriceListPreview({
  entityId,
  entityDataUpdate,
  transformProductsForList,
  setupColumns,
  onUpdateProducts,
  convertPriceModeToRuleField,
  getPriceListProduct,
}: UsePriceListPreviewOptions): UsePriceListPreviewReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const { geinsLogError } = useGeinsLog('composables/usePriceListPreview');
  const { batchQueryNoPagination } = useBatchQuery();
  const { productApi } = useGeinsRepository();

  // =====================================================================================
  // STATE
  // =====================================================================================
  const priceListProducts = ref<PriceListProduct[]>([]);
  const selectedProducts = ref<PriceListProductList[]>([]);
  const updateInProgress = ref(false);

  // =====================================================================================
  // COMPUTED PROPERTIES
  // =====================================================================================
  const hasProductSelection = computed(() => {
    return selectedProducts.value.length > 0;
  });

  // =====================================================================================
  // METHODS
  // =====================================================================================

  const previewPriceList = async (
    feedbackMessage: string = 'Price list preview updated.',
    updateProducts: boolean = false,
    showFeedback: boolean = true,
  ) => {
    if (
      !entityId.value ||
      !entityDataUpdate.value.productSelectionQuery ||
      updateInProgress.value
    )
      return;

    try {
      updateInProgress.value = true;

      const previewPriceList = await productApi.priceList
        .id(entityId.value)
        .preview(entityDataUpdate.value, batchQueryNoPagination.value, {
          fields: ['products', 'productinfo'],
        });

      priceListProducts.value = previewPriceList.products?.items || [];

      if (updateProducts) {
        const editedProducts: PriceListProduct[] = priceListProducts.value
          .filter(
            (p: any) =>
              p.priceMode !== 'rule' &&
              p.priceMode !== 'auto' &&
              p.priceMode !== 'autoRule',
          )
          .map((p: any) => {
            const priceMode = convertPriceModeToRuleField(p.priceMode);
            const value = priceMode ? Number(p[priceMode]) || null : null;
            const product = getPriceListProduct(
              p.productId,
              value,
              priceMode,
              p.staggeredCount,
            );
            return {
              _id: p._id,
              ...product,
            };
          });

        await onUpdateProducts(editedProducts);
      }

      selectedProducts.value = transformProductsForList(
        priceListProducts.value,
        entityDataUpdate.value,
      );

      setupColumns();

      if (showFeedback) {
        toast({
          title: feedbackMessage,
          variant: 'positive',
        });
      }
    } catch (error) {
      geinsLogError('error fetching preview price list:', error);
      toast({
        title: t('error_updating_preview'),
        description: t('error_try_again'),
        variant: 'negative',
      });
    } finally {
      updateInProgress.value = false;
    }
  };

  return {
    // State
    priceListProducts,
    selectedProducts,
    updateInProgress,
    hasProductSelection,

    // Methods
    previewPriceList,
  };
}
