import type { PricelistRule, PricelistRuleMode } from '#shared/types';

export interface UsePricelistQuantityLevelsReturnType {
  // State
  rulesToEdit: Ref<PricelistRule[]>;
  rulesPanelOpen: Ref<boolean>;
  rulesProductId: Ref<string>;
  rulesProductName: Ref<string>;
  actualPricelistRulesMode: Ref<PricelistRuleMode>;
  pendingModeChange: Ref<PricelistRuleMode | null>;
  rulesModeChangePrompt: Ref<boolean>;

  // Computed
  pricelistRulesMode: ComputedRef<PricelistRuleMode>;

  // Methods
  handleSaveRules: (rules: PricelistRule[]) => void;
  confirmModeChange: () => Promise<void>;
  cancelModeChange: () => void;
}

export interface UsePricelistQuantityLevelsOptions {
  globalRules: Ref<PricelistRule[]>;
  updateEntityRules: () => Promise<void>;
  previewPricelist: (message?: string) => Promise<void>;
}

/**
 * Composable for managing product-specific quantity level pricing rules
 */
export function usePricelistQuantityLevels({
  globalRules,
  updateEntityRules,
  previewPricelist,
}: UsePricelistQuantityLevelsOptions): UsePricelistQuantityLevelsReturnType {
  // =====================================================================================
  // STATE
  // =====================================================================================
  const rulesToEdit = ref<PricelistRule[]>([]);
  const rulesPanelOpen = ref(false);
  const rulesProductId = ref<string>('');
  const rulesProductName = ref<string>('');

  // Track the actual mode and pending mode separately
  const actualPricelistRulesMode = ref<PricelistRuleMode>('discount');
  const pendingModeChange = ref<PricelistRuleMode | null>(null);
  const rulesModeChangePrompt = ref(false);

  // =====================================================================================
  // COMPUTED PROPERTIES
  // =====================================================================================

  // Use a computed for the displayed mode with change detection
  const pricelistRulesMode = computed({
    get: () => actualPricelistRulesMode.value,
    set: (newMode: PricelistRuleMode) => {
      if (
        newMode !== actualPricelistRulesMode.value &&
        globalRules.value.length
      ) {
        // Check if there's a base rule that would be affected
        if (globalRules.value.some((rule) => rule.quantity === 1)) {
          // Show confirmation prompt for mode change
          pendingModeChange.value = newMode;
          rulesModeChangePrompt.value = true;
        } else {
          // Safe to change mode immediately
          actualPricelistRulesMode.value = newMode;
        }
      } else {
        actualPricelistRulesMode.value = newMode;
      }
    },
  });

  // =====================================================================================
  // METHODS
  // =====================================================================================

  const handleSaveRules = (rules: PricelistRule[]) => {
    // Update the rules in the system
    rulesToEdit.value = rules;

    // Provide feedback with product context
    previewPricelist(
      `Quantity levels applied for ${rulesProductName.value} (${rulesProductId.value})`,
    );
  };

  const confirmModeChange = async () => {
    rulesModeChangePrompt.value = false;
    if (pendingModeChange.value) {
      actualPricelistRulesMode.value = pendingModeChange.value;
      pendingModeChange.value = null;

      globalRules.value = globalRules.value.filter(
        (rule) => rule.quantity === 1,
      );
      await updateEntityRules();
      await previewPricelist();
    }
  };

  const cancelModeChange = () => {
    rulesModeChangePrompt.value = false;
    pendingModeChange.value = null;
  };

  return {
    // State
    rulesToEdit,
    rulesPanelOpen,
    rulesProductId,
    rulesProductName,
    actualPricelistRulesMode,
    pendingModeChange,
    rulesModeChangePrompt,

    // Computed
    pricelistRulesMode,

    // Methods
    handleSaveRules,
    confirmModeChange,
    cancelModeChange,
  };
}
