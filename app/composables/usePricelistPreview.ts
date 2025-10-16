import type {
  PricelistProduct,
  PricelistProductList,
  ProductPricelistUpdate,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UsePricelistPreviewOptions {
  entityId: Ref<string | null>;
  entityDataUpdate: Ref<ProductPricelistUpdate>;
  transformProductsForList: (
    pricelistProducts: PricelistProduct[],
    entityData: ProductPricelistUpdate,
  ) => PricelistProductList[];
  setupColumns: () => void;
  onUpdateProducts: (editedProducts: PricelistProduct[]) => Promise<void>;
  convertPriceModeToRuleField: (
    priceMode?: PricelistPriceMode,
  ) => PricelistRuleField | undefined;
  getPricelistProduct: (
    productId: string,
    value: number | null,
    priceMode: PricelistRuleField | undefined,
    staggeredCount: number,
  ) => PricelistProduct;
}

export interface UsePricelistPreviewReturnType {
  // State
  pricelistProducts: Ref<PricelistProduct[]>;
  selectedProducts: Ref<PricelistProductList[]>;
  updateInProgress: Ref<boolean>;
  hasProductSelection: ComputedRef<boolean>;

  // Methods
  previewPricelist: (
    feedbackMessage?: string,
    updateProducts?: boolean,
    showFeedback?: boolean,
  ) => Promise<void>;
}

/**
 * Composable for managing pricelist preview functionality and product state
 */
export function usePricelistPreview({
  entityId,
  entityDataUpdate,
  transformProductsForList,
  setupColumns,
  onUpdateProducts,
  convertPriceModeToRuleField,
  getPricelistProduct,
}: UsePricelistPreviewOptions): UsePricelistPreviewReturnType {
  const { toast } = useToast();
  const { geinsLogError } = useGeinsLog('composables/usePricelistPreview');
  const { batchQueryNoPagination } = useBatchQuery();
  const { productApi } = useGeinsRepository();

  // =====================================================================================
  // STATE
  // =====================================================================================
  const pricelistProducts = ref<PricelistProduct[]>([]);
  const selectedProducts = ref<PricelistProductList[]>([]);
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

  const previewPricelist = async (
    feedbackMessage: string = 'Pricelist preview updated.',
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

      const previewPricelist = await productApi.pricelist
        .id(entityId.value)
        .preview(entityDataUpdate.value, batchQueryNoPagination.value, {
          fields: ['products', 'productinfo'],
        });

      pricelistProducts.value = previewPricelist.products?.items || [];

      if (updateProducts) {
        const editedProducts: PricelistProduct[] = pricelistProducts.value
          .filter(
            (p: any) =>
              p.priceMode !== 'rule' &&
              p.priceMode !== 'auto' &&
              p.priceMode !== 'autoRule',
          )
          .map((p: any) => {
            const priceMode = convertPriceModeToRuleField(p.priceMode);
            const value = priceMode ? Number(p[priceMode]) || null : null;
            const product = getPricelistProduct(
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
        pricelistProducts.value,
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
      geinsLogError('error fetching preview pricelist:', error);
      toast({
        title: 'Error updating pricelist preview',
        description: 'Please try again.',
        variant: 'negative',
      });
    } finally {
      updateInProgress.value = false;
    }
  };

  return {
    // State
    pricelistProducts,
    selectedProducts,
    updateInProgress,
    hasProductSelection,

    // Methods
    previewPricelist,
  };
}
