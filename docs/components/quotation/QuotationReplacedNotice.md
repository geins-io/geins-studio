# `QuotationReplacedNotice`

`QuotationReplacedNotice` tells the seller that a later version replaced the quotation they're looking at, and links to it with **View latest version**. It's the read-only lock box's [`Item`](https://www.shadcn-vue.com/docs/components/item) pattern, on the card surface.

## Features

- Title: "{number} is revised." on a replaced offer, or "The customer's request, as they sent it." on a buyer's request answered by an offer
- Description: "{number} replaces it.", naming the version it links to
- **View latest version** opens the replacing version's page (`entityEditUrl('quotation', id)`)
- Copy follows Tina's prototype (`[id].jsx`, the `pastVersion` notice)

## Usage

The quotation page shows it at the top of the General and Changelog tabs whenever `replacingVersion()` finds a version. That's the chain's live version, not the version that revised this one, so it always links to the newest. Without a chain in the response it falls back to `revisedBy`.

```vue
<template>
  <QuotationReplacedNotice
    v-if="replacedBy"
    :quotation-number="quotation.quotationNumber"
    :replaced-by="replacedBy"
    :request="isAnsweredRequest(quotation)"
  />
</template>
```

## Props

### `quotationNumber`

```ts
quotationNumber: string;
```

The number of the version shown.

### `replacedBy`

```ts
replacedBy: QuotationVersionRef;
```

The version that replaces it: `{ quotationId, quotationNumber }`.

### `request`

```ts
request?: boolean;
```

Whether the version shown is the buyer's request, answered by an offer (`isAnsweredRequest()`).

- **Default:** `false`

## Dependencies

- [`Item`](https://www.shadcn-vue.com/docs/components/item) (shadcn-vue)
