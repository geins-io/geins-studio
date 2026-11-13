# `QuotationVersionSelect`

`QuotationVersionSelect` is the version picker in a quotation's page header. It lists every version in the quotation's revision chain (`quotation.revisions`) and opens the one you pick. Each version is its own quotation with its own id, so picking one navigates to its page.

## Features

- Options in the order `revisions` lists them: newest first, the open draft included, the buyer's request last
- Each option reads `<quotation number> · <status> · <sent date>`:
  - the chain's live version (the newest that isn't a draft, `liveRevision()`) reads **Latest** instead of its status
  - a buyer's request answered by an offer reads **Answered** (`isAnsweredRequest()`)
  - other statuses read as `StatusBadge` shows them (Draft, Revised, …)
  - the date is `validFrom`, when the version was sent, as a medium date; a draft and the buyer's request were never sent, so they have none
- Shows the version on screen as the selected option; picking another navigates with `entityEditUrl('quotation', id)`. That stays on the same `[id]` route, and `useUnsavedChanges`' update guard asks before unsaved edits on a draft are lost

## Usage

The quotation page renders it first in the `ContentActionBar`, and only when the chain has more than one version. On a revised version, which has no actions, it's the only thing in the bar.

```vue
<template>
  <ContentActionBar>
    <QuotationVersionSelect
      v-if="(quotation.revisions?.length ?? 0) > 1"
      :revisions="quotation.revisions"
      :quotation-id="quotation._id"
    />
    <!-- actions -->
  </ContentActionBar>
</template>
```

## Props

### `revisions`

```ts
revisions: QuotationRevision[];
```

Every version in the chain, newest first, as the quotation response's `revisions` lists them. The API sends it only with `fields=revisions` (or `all`).

### `quotationId`

```ts
quotationId: string;
```

The version shown: the selected option.

## Dependencies

- [`Select`](https://www.shadcn-vue.com/docs/components/select) (shadcn-vue)
- [`useDate`](/composables/useDate)
- `liveRevision`, `isAnsweredRequest` (`shared/utils/quotation.ts`)
