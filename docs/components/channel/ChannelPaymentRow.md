# `ChannelPaymentRow`

`ChannelPaymentRow` is one row in [`ChannelPaymentsTab`](/components/channel/ChannelPaymentsTab) — payment provider logo, name, market + customer-type tooltips, and an active toggle.

## Features

- Maps known provider identifiers to an SVG logo: `avarda`, `geinspay`, `klarnacheckoutv3`, `manualinvoice`, `sveacheckout`, `walleycheckout`. Unknown providers fall back to a Lucide `ImageOff` icon
- Markets and customer types render as truncated [`ContentTextTooltip`](/components/content/text/ContentTextTooltip) — full lists in the tooltip via the `createTooltip` utility
- Whole row dims when the payment method is inactive
- `onChange` callback prop (not an event) — wired by the parent

## Usage

```vue
<template>
  <ChannelPaymentRow
    v-for="payment in payments"
    :key="payment._id"
    :payment="payment"
    :all-markets="allMarkets"
    :on-change="(active) => updatePayment(payment._id, active)"
  />
</template>
```

## Props

### `payment`

```ts
payment: ChannelPaymentMethod
```

The provider configuration to render.

### `allMarkets`

```ts
allMarkets?: Market[]
```

Used to resolve `payment.markets` ids into `"Country (CUR)"` labels.

### `onChange`

```ts
onChange: (active: boolean) => void
```

Callback fired when the active switch flips.

### `disabled`

```ts
disabled?: boolean
```

Disables the toggle.

## Dependencies

- shadcn-vue `Item` family, `Switch`
- [`ContentTextTooltip`](/components/content/text/ContentTextTooltip) — markets + customer-type tooltips
- `createTooltip` utility — formats the truncated label + tooltip pair
