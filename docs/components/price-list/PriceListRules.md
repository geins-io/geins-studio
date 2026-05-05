# `PriceListRules`

`PriceListRules` is the editable table of price-break rules — a stack of [`PriceListRule`](/components/price-list/PriceListRule) rows with an "Add break" button. Drives both the price-list-level rules editor (margin / discount mode) and the per-product volume-pricing sheet (all mode).

## Features

- Three modes via `mode`: `margin`, `discount`, `all`
- Local rules state synced from `props.rules` — emits `update` whenever the local list changes (debounced via prop replacement guard so external syncs don't echo)
- Per-row updates are debounced server-side by the parent — emits `update-rule` with `{ index, rule }` so the parent can call a preview API and write the result back
- Stable identity per row via `internalId` (auto-generated when missing) — keeps Vue keyed renders correct across edits
- Loading flag (`v-model:loading`) routed to the row whose `loadingIndex` matches
- Add break button hidden when `disabled` is `true` (used for the global-rules read-only preview)

## Usage

### Price-list rules tab (margin or discount mode)

```vue
<template>
  <PriceListRulesWrapper
    :title="$t('pricing.price_list_rules')"
    mode-id="rules-mode"
    v-model:mode="ruleMode"
  >
    <PriceListRules
      :rules="rules"
      :mode="ruleMode"
      :currency="currency"
      :vat-description="vatDescription"
      @update="(r) => (rules = r)"
      @apply="(rule) => applyRule(rule, false)"
      @apply-overwrite="(rule) => applyRule(rule, true)"
      @remove="removeRule"
    />
  </PriceListRulesWrapper>
</template>
```

### Inside the volume-pricing sheet (all mode)

```vue
<template>
  <PriceListRules
    v-model:loading="rulesLoading"
    mode="all"
    show-loading
    :rules="editableRules"
    :currency="currency"
    :vat-description="vatDescription"
    @update-rule="onUpdateRule"
    @update="(r) => (editableRules = r)"
    @remove="removeRule"
  />
</template>
```

## Props

### `rules`

```ts
rules: PriceListRule[]
```

The current set of rules. Each rule should carry a stable `internalId` — generated automatically when missing.

### `mode`

```ts
mode: 'margin' | 'discount' | 'all'
```

Which columns render in each row. See [`PriceListRule`](/components/price-list/PriceListRule).

### `currency`

```ts
currency?: string
```

Forwarded to each row (only used in `all` mode).

### `disabled`

```ts
disabled?: boolean
```

Hides the Add break button — used to render the global-rules preview as read-only.

- **Default:** `false`

### `vatDescription`

```ts
vatDescription?: string
```

Localized VAT descriptor (e.g. `"ex VAT"`) appended to the price column header in `all` mode.

### `showLoading`

```ts
showLoading?: boolean
```

When `true`, sets `loading` to `true` while a row's preview update is in flight.

- **Default:** `false`

## v-model

### `loading`

```ts
v-model:loading: boolean
```

Two-way loading flag — used by the volume-pricing sheet to coordinate the preview-price spinner.

## Events

### `apply`

```ts
(rule: PriceListRule): void
```

### `apply-overwrite`

```ts
(rule: PriceListRule): void
```

### `remove`

```ts
(rule: PriceListRule): void
```

### `update`

```ts
(rules: PriceListRule[]): void
```

Emitted when the local rules list changes (add break, remove, internal sort). Not emitted while syncing from props.

### `update-rule`

```ts
(payload: { index: number; rule: PriceListRule }): void
```

Emitted when a single field in a row changes (margin / discount / price). Parent typically debounces an API call and writes the result back.

## Dependencies

- [`PriceListRule`](/components/price-list/PriceListRule) — each row
- shadcn-vue `Button`
- `generateInternalId` utility — stable row keys
