import type { PriceListRule, PriceListRuleMode } from '#shared/types';

export interface UsePriceListVolumePricingReturnType {
  // State
  rulesToEdit: Ref<PriceListRule[]>;
  rulesPanelOpen: Ref<boolean>;
  rulesProductId: Ref<string>;
  rulesProductName: Ref<string>;
  actualPriceListRulesMode: Ref<PriceListRuleMode>;
  pendingModeChange: Ref<PriceListRuleMode | null>;
  rulesModeChangePrompt: Ref<boolean>;

  // Computed
  priceListRulesMode: ComputedRef<PriceListRuleMode>;

  // Methods
  handleSaveRules: (rules: PriceListRule[]) => void;
  confirmModeChange: () => Promise<void>;
  cancelModeChange: () => void;
}

export interface UsePriceListVolumePricingOptions {
  globalRules: Ref<PriceListRule[]>;
  updateEntityRules: () => Promise<void>;
  previewPriceList: (message?: string) => Promise<void>;
}

/**
 * Composable for managing product-specific price breaks
 */
export function usePriceListVolumePricing({
  globalRules,
  updateEntityRules,
  previewPriceList,
}: UsePriceListVolumePricingOptions): UsePriceListVolumePricingReturnType {
  // =====================================================================================
  // STATE
  // =====================================================================================
  const rulesToEdit = ref<PriceListRule[]>([]);
  const rulesPanelOpen = ref(false);
  const rulesProductId = ref<string>('');
  const rulesProductName = ref<string>('');

  // Track the actual mode and pending mode separately
  const actualPriceListRulesMode = ref<PriceListRuleMode>('discount');
  const pendingModeChange = ref<PriceListRuleMode | null>(null);
  const rulesModeChangePrompt = ref(false);

  // =====================================================================================
  // COMPUTED PROPERTIES
  // =====================================================================================

  // Use a computed for the displayed mode with change detection
  const priceListRulesMode = computed({
    get: () => actualPriceListRulesMode.value,
    set: (newMode: PriceListRuleMode) => {
      if (
        newMode !== actualPriceListRulesMode.value &&
        globalRules.value.length
      ) {
        // Check if there's a base rule that would be affected
        if (globalRules.value.some((rule) => rule.quantity === 1)) {
          // Show confirmation prompt for mode change
          pendingModeChange.value = newMode;
          rulesModeChangePrompt.value = true;
        } else {
          // Safe to change mode immediately
          actualPriceListRulesMode.value = newMode;
        }
      } else {
        actualPriceListRulesMode.value = newMode;
      }
    },
  });

  // =====================================================================================
  // METHODS
  // =====================================================================================

  const handleSaveRules = (rules: PriceListRule[]) => {
    // Update the rules in the system
    rulesToEdit.value = rules;

    // Provide feedback with product context
    previewPriceList(
      `Volume pricing applied for ${rulesProductName.value} (${rulesProductId.value})`,
    );
  };

  const confirmModeChange = async () => {
    rulesModeChangePrompt.value = false;
    if (pendingModeChange.value) {
      actualPriceListRulesMode.value = pendingModeChange.value;
      pendingModeChange.value = null;

      globalRules.value = globalRules.value.filter(
        (rule) => rule.quantity === 1,
      );
      await updateEntityRules();
      await previewPriceList();
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
    actualPriceListRulesMode,
    pendingModeChange,
    rulesModeChangePrompt,

    // Computed
    priceListRulesMode,

    // Methods
    handleSaveRules,
    confirmModeChange,
    cancelModeChange,
  };
}
