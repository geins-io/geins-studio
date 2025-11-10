# `usePricelistQuantityLevels`

The `usePricelistQuantityLevels` composable manages product-specific quantity level pricing rules and handles pricing mode changes with proper user confirmation prompts. It provides state management for the volume pricing editing panel and ensures safe mode transitions.

:::warning NOTE
This composable is specifically designed to work alongside other pricelist management composables, like [`usePricelistRules`](usePricelistRules.md) and [`usePricelistPreview`](usePricelistPreview.md).
:::

## Features

- **Quantity level rules editing** with panel state management
- **Pricing mode change detection** with user confirmation prompts
- **Product-specific rule management** with context tracking
- **Safe mode transitions** with base rule cleanup

## Usage

### Basic Usage

```ts
const {
  rulesToEdit,
  rulesPanelOpen,
  pricelistRulesMode,
  handleSaveRules,
  confirmModeChange,
} = usePricelistQuantityLevels({
  globalRules,
  updateEntityRules,
  previewPricelist,
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

### `UsePricelistQuantityLevelsOptions`

```ts
interface UsePricelistQuantityLevelsOptions {
  globalRules: Ref<PricelistRule[]>;
  updateEntityRules: () => Promise<void>;
  previewPricelist: (message?: string) => Promise<void>;
}
```

- **`globalRules`**: Reactive reference to all global pricelist rules
- **`updateEntityRules`**: Function to synchronize rules with entity data
- **`previewPricelist`**: Function to refresh the pricelist preview

## Properties and Methods

### `rulesToEdit`

```ts
const rulesToEdit: Ref<PricelistRule[]>;
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

### `actualPricelistRulesMode`

```ts
const actualPricelistRulesMode: Ref<PricelistRuleMode>;
```

The current pricing mode ('margin', 'discount', 'fixed', 'auto').

### `pendingModeChange`

```ts
const pendingModeChange: Ref<PricelistRuleMode | null>;
```

Tracks a pending mode change that requires user confirmation.

### `rulesModeChangePrompt`

```ts
const rulesModeChangePrompt: Ref<boolean>;
```

Controls the visibility of the mode change confirmation dialog.

### `pricelistRulesMode`

```ts
const pricelistRulesMode: ComputedRef<PricelistRuleMode>;
```

Computed property that handles pricing mode changes with confirmation prompts.

- **Get**: Returns the current `actualPricelistRulesMode`
- **Set**: Triggers confirmation prompt if base rules exist, otherwise changes immediately
- **Behavior**: Protects against accidentally removing base rules during mode changes

### `handleSaveRules`

```ts
handleSaveRules(rules: PricelistRule[]): void
```

Processes saved quantity level rules and triggers preview update.

- **Parameters**:
  - `rules`: Array of updated quantity level rules
- **Behavior**:
  - Updates `rulesToEdit` with the new rules
  - Triggers pricelist preview with descriptive feedback message
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
interface PricelistRule {
  quantity: number;
  price?: number;
  margin?: number;
  discountPercent?: number;
  global: boolean;
  lastFieldChanged?: PricelistRuleField;
  _id?: string;
  internalId?: string;
}

type PricelistRuleMode = 'margin' | 'discount' | 'fixed' | 'auto';
```
