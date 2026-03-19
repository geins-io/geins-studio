---
title: 'Create ChannelPaymentRow reusable list item component'
project: 'Self Service (Channels)'
milestone: 'M5 — Payments Tab'
priority: 2
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './001-payment-types-and-repository.md'
model: haiku
mode: claude-code agent
---

## Context

The Payments tab renders each payment method as a list row with an icon/logo, name, contextual subtitle (markets, customer types, customer groups), and an enable/disable toggle switch. Isolating this into a standalone presentational component keeps the tab card clean and makes the row independently testable.

## Expected Outcome

A new `app/components/channel/ChannelPaymentRow.vue` component that:

- Displays the payment method icon/logo (falling back gracefully when absent).
- Shows the payment method name as a heading.
- Shows a subtitle line: `"Markets: X | Customer types: X | Customer groups: X"` using counts from the prop arrays.
- Renders a shadcn-vue `Switch` for the `active` state.
- Calls `onChange(newValue)` when the switch is toggled.
- Accepts an optional `disabled` prop forwarded to the `Switch`.
- Contains no channel-specific state or API calls.

## Implementation Notes

### Props

```ts
defineProps<{
  payment: ChannelPayment
  onChange: (active: boolean) => void
  disabled?: boolean
}>()
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [icon]  Payment name                     [Switch]  │
│          Markets: 2 | Customer types: 1 | Groups: 1 │
└─────────────────────────────────────────────────────┘
```

Use `<div class="flex items-center gap-4 py-3">` as the row wrapper. Border separator between rows is handled by the parent card (e.g. `divide-y`).

- **Icon**: `<img>` with `class="h-8 w-8 object-contain"` when `payment.icon` is set; otherwise a neutral `ImageOff` Lucide icon placeholder with `class="h-8 w-8 text-muted-foreground"`.
- **Text block**: `flex-1` column. Name in `text-sm font-medium`, subtitle in `text-xs text-muted-foreground`.
- **Subtitle**: `t('channel.payment_subtitle', { markets: payment.markets.length, customerTypes: payment.customerTypes.length, customerGroups: payment.customerGroups.length })`.
- **Switch**: shadcn-vue `Switch` with `:checked="payment.active"` `@update:checked="onChange"` `:disabled="disabled"`.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:

- `channel.payment_subtitle`: `"Markets: {markets} | Customer types: {customerTypes} | Groups: {customerGroups}"`

## Acceptance Criteria

- Component renders icon image when `payment.icon` is present; renders placeholder icon when absent.
- Name and subtitle are displayed with correct counts from the prop arrays.
- Switch reflects `payment.active`; toggling calls `onChange` with the new boolean.
- `disabled` prop prevents toggling.
- Component imports `ChannelPayment` from `#shared/types` — no inline type definitions.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that `onChange` is called with `true` when switch is toggled on; test that `onChange` is called with `false` when toggled off; test that `disabled` prevents `onChange` from firing; test that subtitle counts reflect the length of each passed array.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Single presentational component with clear bounded scope and no stateful logic — straightforward for haiku.
