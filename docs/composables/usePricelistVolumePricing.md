# `usePriceListVolumePricing`

The `usePriceListVolumePricing` composable manages product-specific price break pricing rules and handles pricing mode changes with proper user confirmation prompts. It provides state management for the volume pricing editing panel and ensures safe mode transitions.

:::warning NOTE
This composable is specifically designed to work alongside other price list management composables, like [`usePriceListRules`](usePriceListRules.md) and [`usePriceListPreview`](usePriceListPreview.md).
:::

## Features

- **Price break editing** with panel state management
- **Pricing mode change detection** with user confirmation prompts
- **Product-specific rule management** with context tracking
- **Safe mode transitions** with base rule cleanup

## Usage

### Basic Usage

```ts
const {
  rulesToEdit,
  rulesPanelOpen,
  price listRulesMode,
  handleSaveRules,
  confirmModeChange,
} = usePriceListVolumePricing({
  globalRules,
  updateEntityRules,
  previewPriceList,
});

// Open volume pricing panel for a product
rulesProductId.value = 'product-123';
rulesProductName.value = 'Sample Product';
rulesToEdit.value = productQuantityRules;
rulesPanelOpen.value = true;

// Handle rule changes
handleSaveRules(updatedRules);
```

## Options

### `UsePriceListVolumePricingOptions`

```ts
interface UsePriceListVolumePricingOptions {
  globalRules: Ref<PriceListRule[]>;
  updateEntityRules: () => Promise<void>;
  previewPriceList: (message?: string) => Promise<void>;
}
```

- **`globalRules`**: Reactive reference to all global price list rules
- **`updateEntityRules`**: Function to synchronize rules with entity data
- **`previewPriceList`**: Function to refresh the price list preview

## Properties and Methods

### `rulesToEdit`

```ts
const rulesToEdit: Ref<PriceListRule[]>;
```

Array of rules currently being edited in the volume pricing panel.

### `rulesPanelOpen`

```ts
const rulesPanelOpen: Ref<boolean>;
```

Controls the visibility of the volume pricing editing panel.

### `rulesProductId`

```ts
const rulesProductId: Ref<string>;
```

ID of the product whose volume pricing are being edited.

### `rulesProductName`

```ts
const rulesProductName: Ref<string>;
```

Name of the product whose volume pricing are being edited.

### `actualPriceListRulesMode`

```ts
const actualPriceListRulesMode: Ref<PriceListRuleMode>;
```

The current pricing mode ('margin', 'discount', 'fixed', 'auto').

### `pendingModeChange`

```ts
const pendingModeChange: Ref<PriceListRuleMode | null>;
```

Tracks a pending mode change that requires user confirmation.

### `rulesModeChangePrompt`

```ts
const rulesModeChangePrompt: Ref<boolean>;
```

Controls the visibility of the mode change confirmation dialog.

### `priceListRulesMode`

```ts
const price listRulesMode: ComputedRef<PriceListRuleMode>;
```

Computed property that handles pricing mode changes with confirmation prompts.

- **Get**: Returns the current `actualPriceListRulesMode`
- **Set**: Triggers confirmation prompt if base rules exist, otherwise changes immediately
- **Behavior**: Protects against accidentally removing base rules during mode changes

### `handleSaveRules`

```ts
handleSaveRules(rules: PriceListRule[]): void
```

Processes saved price break rules and triggers preview update.

- **Parameters**:
  - `rules`: Array of updated price break rules
- **Behavior**:
  - Updates `rulesToEdit` with the new rules
  - Triggers price list preview with descriptive feedback message
  - Includes product context in the feedback

### `confirmModeChange`

```ts
confirmModeChange(): Promise<void>
```

Confirms a pending pricing mode change and modifies global rules.

- **Behavior**:
  - Closes the confirmation prompt
  - Applies the pending mode change
  - Updates entity rules and refreshes preview

### `cancelModeChange`

```ts
cancelModeChange(): void
```

Cancels a pending mode change and resets state.

- **Behavior**:
  - Closes the confirmation prompt
  - Clears the pending mode change
  - No changes are applied to rules or mode

## Type Definitions

```ts
interface PriceListRule {
  _id?: string;
  internalId?: string;
  quantity?: number;
  margin?: number;
  discountPercent?: number;
  price?: number;
  applied?: boolean;
  global?: boolean;
  lastFieldChanged?: PriceListRuleField;
}

type PriceListRuleMode = 'margin' | 'discount' | 'fixed' | 'auto';
```
