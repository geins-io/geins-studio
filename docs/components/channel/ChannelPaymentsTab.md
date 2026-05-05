# `ChannelPaymentsTab`

`ChannelPaymentsTab` is the **Payments** card on a channel's edit page — wraps a stack of [`ChannelPaymentRow`](/components/channel/ChannelPaymentRow) inside a [`ContentEditCard`](/components/content/edit/ContentEditCard) with empty-state handling and per-row active toggles.

## Features

- Stack of payment rows separated by dividers
- Empty state with a `CreditCard` icon when no payment methods are returned
- `update:payments` two-way binding — toggles emit a fresh array with the changed payment immutably updated
- `loading` greys the section out and disables interactions

## Usage

```vue
<template>
  <ChannelPaymentsTab
    v-model:payments="channel.payments"
    :all-markets="allMarkets"
    :loading="loading"
  />
</template>
```

## Props

### `payments`

```ts
payments: ChannelPaymentMethod[]
```

The payment-method list. Two-way via `update:payments`.

### `allMarkets`

```ts
allMarkets?: Market[]
```

Forwarded to each row for market label resolution.

### `loading`

```ts
loading?: boolean
```

- **Default:** `false`

## Events

### `update:payments`

```ts
(payments: ChannelPaymentMethod[]): void
```

Emitted with the new array when any row's active toggle flips.

## Dependencies

- [`ContentEditCard`](/components/content/edit/ContentEditCard), [`ChannelPaymentRow`](/components/channel/ChannelPaymentRow)
- shadcn-vue `Empty`
