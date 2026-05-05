# `PriceListRulesWrapper`

`PriceListRulesWrapper` is the bordered card around a [`PriceListRules`](/components/price-list/PriceListRules) editor — title on the left, "calculate by" mode select (margin / discount) on the right, plus default + footer slots for the rules table.

## Features

- Title bar with [`ContentCardHeader`](/components/content/ContentCardHeader) and a "calculate by" `Select` (margin or discount)
- Two-way `v-model:mode` for the calculation mode
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
title: string
```

Heading rendered in the title bar.

### `modeId`

```ts
modeId: string
```

`id` for the mode `Select` — pair with the `Label`'s `for` attribute.

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
