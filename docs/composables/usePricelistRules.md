# `usePricelistRules`

The `usePricelistRules` composable provides comprehensive management for global pricelist rules, including base pricing rules and quantity-level pricing. It handles rule application, updates, and removal with proper state management and user prompts for overwrite scenarios.

:::warning NOTE
This composable is specifically designed to work alongside other pricelist management composables, like [`usePricelistPreview`](usePricelistPreview.md) and [`usePricelistQuantityLevels`](usePricelistQuantityLevels.md).
:::

## Features

- **Global rule management** with base pricing and volume pricing
- **Rule application and overwriting** with user confirmation prompts
- **Computed state tracking** for rule modes and percentages
- **Asynchronous rule updates** with error handling and user feedback

## Usage

### Basic Usage

```ts
const {
  globalRules,
  baseRule,
  baseRuleText,
  applyBaseRule,
  removeBaseRule,
  applyRule,
  removeRule,
} = usePricelistRules({
  entityDataUpdate,
  previewPricelist,
});

// Apply a global margin rule
await applyBaseRule(25, 'margin');

// Apply a quantity level rule
await applyRule({
  quantity: 10,
  discountPercent: 15,
  global: true,
});
```

## Options

### `UsePricelistRulesOptions`

```ts
interface UsePricelistRulesOptions {
  entityDataUpdate: Ref<ProductPricelistUpdate>;
  previewPricelist: (message?: string) => Promise<void>;
}
```

- **`entityDataUpdate`**: Reactive reference to the pricelist entity being updated
- **`previewPricelist`**: Function to refresh the pricelist preview with optional feedback message

## Properties and Methods

### `globalRules`

```ts
const globalRules: Ref<PricelistRule[]>;
```

Reactive array containing all global pricelist rules.

### `baseRuleLoading`

```ts
const baseRuleLoading: Ref<boolean>;
```

Loading state for base rule operations.

### `volumePricingLoading`

```ts
const volumePricingLoading: Ref<boolean>;
```

Loading state for quantity level rule operations.

### `quantityLevelRules`

```ts
const quantityLevelRules: ComputedRef<PricelistRule[]>;
```

Filtered array of rules excluding the base rule (quantity !== 1).

### `baseRule`

```ts
const baseRule: ComputedRef<PricelistRule | undefined>;
```

The base pricing rule with quantity = 1, if it exists.

### `baseRuleMode`

```ts
const baseRuleMode: ComputedRef<'margin' | 'discount' | null>;
```

The pricing mode of the base rule ('margin' or 'discount').

### `baseRulePercentage`

```ts
const baseRulePercentage: ComputedRef<number | null>;
```

The percentage value of the base rule.

### `baseRuleText`

```ts
const baseRuleText: ComputedRef<string>;
```

Human-readable description of the current base rule.

### `applyBaseRule`

```ts
applyBaseRule(percentage: number, mode: PricelistRuleMode): Promise<void>
```

Applies a global base pricing rule.

- **Parameters**:
  - `percentage`: The percentage value for the rule
  - `mode`: The pricing mode ('margin', 'discount', 'fixed', 'auto')
- **Behavior**: Creates or updates the quantity=1 global rule
- **Side effects**: Updates entity rules and triggers preview refresh

### `applyBaseRuleAndOverwrite`

```ts
applyBaseRuleAndOverwrite(percentage: number, mode: PricelistRuleMode): Promise<void>
```

Applies a base rule with option to overwrite existing product-specific pricing.

- **Parameters**: Same as `applyBaseRule`
- **Behavior**: Shows confirmation prompt if products exist, then applies rule
- **Prompt management**: Uses `overwriteBaseRulePromptVisible` state

### `removeBaseRule`

```ts
removeBaseRule(): Promise<void>
```

Removes the current base pricing rule.

- **Behavior**: Filters out quantity=1 rules and updates entity
- **Feedback**: Provides descriptive removal message

### `applyRule`

```ts
applyRule(rule: PricelistRule): Promise<void>
```

Applies or updates a quantity-level pricing rule.

- **Parameters**:
  - `rule`: Complete rule object with quantity, pricing, and metadata
- **Behavior**: Updates existing rule or adds new one based on matching logic
- **Matching**: Uses internal ID, external ID, or quantity for rule identification

### `applyAndOverwriteRule`

```ts
applyAndOverwriteRule(rule: PricelistRule): Promise<void>
```

Applies a quantity rule with option to overwrite existing product-specific pricing.

- **Parameters**: Same as `applyRule`
- **Prompt management**: Uses `overwriteLevelsPromptVisible` state

### `removeRule`

```ts
removeRule(rule: PricelistRule): Promise<void>
```

Removes a specific quantity-level rule.

- **Parameters**:
  - `rule`: Rule to remove (matched by ID or quantity)
- **Behavior**: Filters rule from global rules array

### `updateEntityRules`

```ts
updateEntityRules(): Promise<void>
```

Synchronizes global rules with the entity data structure.

- **Behavior**:
  - Cleans internal IDs from rules
  - Preserves existing quantity=1 rules when appropriate
  - Updates `entityDataUpdate.value.rules`

### `cleanRulesForEntityData`

```ts
cleanRulesForEntityData(rules: PricelistRule[]): PricelistRule[]
```

Helper method that cleans rules for entity data storage.

- **Parameters**:
  - `rules`: Array of rules to clean
- **Behavior**: Removes internal IDs and keeps only essential fields (\_id, quantity, margin, discountPercent, price)

### `overwriteProducts`

```ts
overwriteProducts(staggeredCount: number): Promise<void>
```

Removes product-specific pricing for a given quantity level.

- **Parameters**:
  - `staggeredCount`: The quantity level to clear pricing for
- **Behavior**: Sets price, margin, and discountPercent to undefined for products at the specified quantity level

### `overwriteBaseRulePromptVisible`

```ts
const overwriteBaseRulePromptVisible: Ref<boolean>;
```

Controls visibility of base rule overwrite confirmation dialog.

### `overwriteLevelsPromptVisible`

```ts
const overwriteLevelsPromptVisible: Ref<boolean>;
```

Controls visibility of quantity level overwrite confirmation dialog.

### `removeBaseRulePromptVisible`

```ts
const removeBaseRulePromptVisible: Ref<boolean>;
```

Controls visibility of base rule removal confirmation dialog.

### `currentOverwriteQuantity`

```ts
const currentOverwriteQuantity: Ref<number>;
```

Tracks the quantity level being overwritten for prompt context.

### `overwriteContinueAction`

```ts
const overwriteContinueAction: Ref<() => void>;
```

Stores the continuation function for confirmed overwrite operations.

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
