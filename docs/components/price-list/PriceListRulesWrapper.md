# `PriceListRulesWrapper`

`PriceListRulesWrapper` is the bordered card around a [`PriceListRules`](/components/price-list/PriceListRules) editor — title on the left, "calculate by" mode select (margin / discount) on the right, plus default + footer slots for the rules table.

## Features

- Title bar with [`ContentCardHeader`](/components/content/ContentCardHeader) and a "calculate by" `Select` (margin or discount)
- Two-way `v-model:mode` for the calculation mode
- `unavailableModes` disables a mode no product can use, with its reason under the options
- Default slot for the rules table; `footer` slot for trailing content (e.g. apply-all button)
- `v-auto-animate` on the footer for smooth height changes

## Usage

```vue
<script setup lang="ts">
import type { PriceListRuleMode } from '#shared/types';

const ruleMode = ref<PriceListRuleMode>('margin');
</script>

<template>
  <PriceListRulesWrapper
    :title="$t('pricing.price_list_rules')"
    mode-id="rules-mode"
    v-model:mode="ruleMode"
  >
    <PriceListRules :rules="rules" :mode="ruleMode" @update="onUpdate" />
    <template #footer>
      <Button :disabled="!hasUnapplied" @click="applyAll">
        {{ $t('apply_all') }}
      </Button>
    </template>
  </PriceListRulesWrapper>
</template>
```

## Props

### `title`

```ts
title: string;
```

Heading rendered in the title bar.

### `modeId`

```ts
modeId: string;
```

`id` for the mode `Select` — pair with the `Label`'s `for` attribute.

### `disabled`

```ts
disabled?: boolean
```

Disables the mode `Select`. Slot content handles its own disabled state.

- **Default:** `false`

### `unavailableModes`

```ts
unavailableModes?: PriceListRuleMode[]
```

Modes no product in the list can use (`getUnavailablePriceListRuleModes`): `discount` when no product has a price, `margin` when none has a purchase price. Each is a disabled option, and its reason shows as helper text under the options — a disabled item takes no pointer events, so it can't hold a tooltip. The host keeps `mode` off a disabled option (`usePriceListEditor` switches to the other one).

- **Default:** `[]`

## v-model

### `mode`

```ts
v-model:mode: PriceListRuleMode  // 'margin' | 'discount'
```

The currently selected calculation mode. **Required.**

## Slots

### default

The rules table — typically [`PriceListRules`](/components/price-list/PriceListRules).

### `footer`

Trailing content below the rules (apply-all button, info text, etc.).

## Dependencies

- shadcn-vue [`Select`](/components/shadcn-vue), `Label`
- [`ContentCardHeader`](/components/content/ContentCardHeader)
- `v-auto-animate` directive
