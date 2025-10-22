import type {
  PricelistRule,
  PricelistRuleMode,
  ProductPricelistUpdate,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UsePricelistRulesOptions {
  entityDataUpdate: Ref<ProductPricelistUpdate>;
  previewPricelist: (message?: string) => Promise<void>;
}

export interface UsePricelistRulesReturnType {
  // State
  globalRules: Ref<PricelistRule[]>;
  baseRuleLoading: Ref<boolean>;
  quantityLevelsLoading: Ref<boolean>;

  // Computed
  quantityLevelRules: ComputedRef<PricelistRule[]>;
  baseRule: ComputedRef<PricelistRule | undefined>;
  baseRuleMode: ComputedRef<'margin' | 'discount' | null>;
  baseRulePercentage: ComputedRef<number | null>;
  baseRuleText: ComputedRef<string>;

  // Methods
  applyBaseRule: (percentage: number, mode: PricelistRuleMode) => Promise<void>;
  applyBaseRuleAndOverwrite: (
    percentage: number,
    mode: PricelistRuleMode,
  ) => Promise<void>;
  removeBaseRule: () => Promise<void>;
  applyRule: (rule: PricelistRule) => Promise<void>;
  applyAndOverwriteRule: (rule: PricelistRule) => Promise<void>;
  removeRule: (rule: PricelistRule) => Promise<void>;
  updateEntityRules: () => Promise<void>;

  // Prompt state
  overwriteBaseRulePromptVisible: Ref<boolean>;
  overwriteLevelsPromptVisible: Ref<boolean>;
  currentOverwriteQuantity: Ref<number>;
  overwriteContinueAction: Ref<() => void>;
  removeBaseRulePromptVisible: Ref<boolean>;
}

/**
 * Composable for managing global pricelist rules and base pricing logic
 */
export function usePricelistRules({
  entityDataUpdate,
  previewPricelist,
}: UsePricelistRulesOptions): UsePricelistRulesReturnType {
  const { toast } = useToast();
  const { geinsLogError } = useGeinsLog('composables/usePricelistRules');

  // =====================================================================================
  // STATE
  // =====================================================================================
  const globalRules = ref<PricelistRule[]>([]);
  const baseRuleLoading = ref<boolean>(false);
  const quantityLevelsLoading = ref<boolean>(false);

  // Prompt state
  const overwriteBaseRulePromptVisible = ref(false);
  const overwriteLevelsPromptVisible = ref(false);
  const currentOverwriteQuantity = ref<number>(1);
  const overwriteContinueAction = ref(() => {});
  const removeBaseRulePromptVisible = ref(false);

  // =====================================================================================
  // COMPUTED PROPERTIES
  // =====================================================================================

  // Computed property to get only quantity levels (exclude base rule with quantity 1)
  const quantityLevelRules = computed(() => {
    return globalRules.value.filter((rule) => rule.quantity !== 1);
  });

  const baseRule = computed(() => {
    return globalRules.value.find((rule) => rule.quantity === 1);
  });

  const baseRuleMode = computed(() => {
    if (!baseRule.value) return null;
    return baseRule.value.margin !== undefined && baseRule.value.margin !== null
      ? 'margin'
      : 'discount';
  });

  const baseRulePercentage = computed(() => {
    if (!baseRule.value) return null;
    return baseRuleMode.value === 'margin'
      ? (baseRule.value.margin ?? null)
      : (baseRule.value.discountPercent ?? null);
  });

  const baseRuleText = computed(() => {
    if (!baseRule.value) return '';
    return `${baseRulePercentage.value}% ${baseRuleMode.value} applied globally`;
  });

  // =====================================================================================
  // METHODS
  // =====================================================================================

  const applyBaseRule = async (
    percentage: number,
    mode: PricelistRuleMode,
  ): Promise<void> => {
    baseRuleLoading.value = true;
    try {
      // Create global rule for quantity 1
      const globalRule: PricelistRule = {
        quantity: 1,
        global: true,
        ...(mode === 'margin'
          ? { margin: percentage }
          : { discountPercent: percentage }),
      };

      if (!!baseRule.value) {
        globalRule._id = baseRule.value._id;
      }

      globalRules.value = globalRules.value.filter(
        (rule) => rule.quantity !== 1,
      );
      globalRules.value.push(globalRule);

      await updateEntityRules();
      await previewPricelist(`${percentage}% ${mode} applied globally`);
    } catch (error) {
      geinsLogError('error applying base rule:', error);
      toast({
        title: 'Error applying base rule',
        description: 'Please try again.',
        variant: 'negative',
      });
    } finally {
      baseRuleLoading.value = false;
    }
  };

  const applyBaseRuleAndOverwrite = async (
    percentage: number,
    mode: PricelistRuleMode,
  ): Promise<void> => {
    if (entityDataUpdate.value.products) {
      overwriteBaseRulePromptVisible.value = true;
      overwriteContinueAction.value = async () => {
        overwriteBaseRulePromptVisible.value = false;
        await overwriteProducts(1);
        await applyBaseRule(percentage, mode);
      };
      return;
    }
    await applyBaseRule(percentage, mode);
  };

  const removeBaseRule = async () => {
    if (!baseRule.value) return;
    const feedback = `${baseRulePercentage.value}% ${baseRuleMode.value} removed`;
    globalRules.value = globalRules.value.filter((rule) => rule.quantity !== 1);
    entityDataUpdate.value.rules = cleanRulesForEntityData(globalRules.value);
    removeBaseRulePromptVisible.value = false;
    await previewPricelist(feedback);
  };

  const applyRule = async (rule: PricelistRule): Promise<void> => {
    quantityLevelsLoading.value = true;
    let ruleIndex = -1;
    try {
      // Find existing rule index by internal ID first, then by _id
      const existingRuleIndex = globalRules.value.findIndex(
        (r) =>
          (rule.internalId && r.internalId === rule.internalId) ||
          (rule._id && r._id === rule._id) ||
          r.quantity === rule.quantity,
      );

      if (existingRuleIndex !== -1) {
        // Update existing rule
        globalRules.value[existingRuleIndex] = { ...rule };
        ruleIndex = existingRuleIndex;
      } else {
        // Add new rule
        globalRules.value.push({ ...rule });
        ruleIndex = globalRules.value.length - 1;
      }

      await updateEntityRules();
      await previewPricelist('Quantity level applied globally');
    } catch (error) {
      geinsLogError('error applying rules:', error);
      toast({
        title: 'Error applying quantity level',
        description: 'Please try again.',
        variant: 'negative',
      });
    } finally {
      quantityLevelsLoading.value = false;
      const ruleToUpdate = globalRules.value[ruleIndex];
      if (ruleToUpdate) {
        ruleToUpdate.applied = true;
      }
    }
  };

  const applyAndOverwriteRule = async (rule: PricelistRule): Promise<void> => {
    if (entityDataUpdate.value.products) {
      currentOverwriteQuantity.value = Number(rule.quantity);
      overwriteLevelsPromptVisible.value = true;
      overwriteContinueAction.value = async () => {
        overwriteLevelsPromptVisible.value = false;
        await overwriteProducts(currentOverwriteQuantity.value);
        await applyRule(rule);
      };
      return;
    }
    await applyRule(rule);
  };

  const removeRule = async (rule: PricelistRule): Promise<void> => {
    globalRules.value = globalRules.value.filter(
      (r) =>
        !(
          (rule.internalId && r.internalId === rule.internalId) ||
          (rule._id && r._id === rule._id) ||
          (r.quantity === rule.quantity && !rule.internalId && !rule._id)
        ),
    );
    await updateEntityRules();
    await previewPricelist('Quantity level removed.');
  };

  const updateEntityRules = async (): Promise<void> => {
    // Preserve existing quantity 1 rule if it exists and isn't in newRules
    const existingQuantity1Rule = entityDataUpdate.value.rules?.find(
      (rule) => rule.quantity === 1,
    );
    const hasQuantity1InNewRules = globalRules.value.some(
      (rule) => rule.quantity === 1,
    );

    // Start with globalRules and remove internal IDs
    const newRules: PricelistRule[] = globalRules.value.map((rule) => {
      const { internalId, ...cleanRule } = rule;
      return {
        ...cleanRule,
        global: true,
        ...(rule.price && { price: rule.price }),
        ...(rule.margin && { margin: rule.margin }),
        ...(rule.discountPercent && { discountPercent: rule.discountPercent }),
      };
    });

    // Add back the quantity 1 rule if it existed and wasn't replaced
    if (existingQuantity1Rule && !hasQuantity1InNewRules) {
      newRules.push(existingQuantity1Rule);
    }

    entityDataUpdate.value.rules = cleanRulesForEntityData(newRules);
  };

  const cleanRulesForEntityData = (rules: PricelistRule[]): PricelistRule[] => {
    return rules.map((rule) => {
      const { _id, quantity, margin, discountPercent, price } = rule;
      return {
        _id,
        quantity,
        ...(!!margin && { margin }),
        ...(!!discountPercent && { discountPercent }),
        ...(!!price && { price }),
      };
    });
  };

  const overwriteProducts = async (staggeredCount: number) => {
    // Original logic - only keep productId and staggeredCount for overwritten products
    entityDataUpdate.value.products =
      entityDataUpdate.value.products?.map((product) => {
        if (product.staggeredCount === staggeredCount) {
          return {
            productId: product.productId,
            staggeredCount: product.staggeredCount,
          };
        }
        return product;
      }) || [];
  };

  return {
    // State
    globalRules,
    baseRuleLoading,
    quantityLevelsLoading,

    // Computed
    quantityLevelRules,
    baseRule,
    baseRuleMode,
    baseRulePercentage,
    baseRuleText,

    // Methods
    applyBaseRule,
    applyBaseRuleAndOverwrite,
    removeBaseRule,
    applyRule,
    applyAndOverwriteRule,
    removeRule,
    updateEntityRules,

    // Prompt state
    overwriteBaseRulePromptVisible,
    overwriteLevelsPromptVisible,
    currentOverwriteQuantity,
    overwriteContinueAction,
    removeBaseRulePromptVisible,
  };
}
