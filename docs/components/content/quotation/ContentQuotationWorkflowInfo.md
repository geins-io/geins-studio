# `ContentQuotationWorkflowInfo`

`ContentQuotationWorkflowInfo` is the help button + sheet that explains the quotation status workflow — renders two side-by-side flow diagrams (default vs strict) with status badges, action arrows, and actor labels. In edit mode the user can pick which flow this quotation should follow by clicking a card.

## Features

- Trigger is a small `CircleHelp` icon button (no label) — meant to sit next to a setting label
- Sheet body shows two flow cards: **default** (Draft → Pending → Finalized) and **strict** (adds Accepted + Confirmed steps)
- Each step renders [`StatusBadge`](/components/StatusBadge) plus actor labels and a description; arrows between steps show the action that triggers the transition (Lucide icon + label)
- Currently-selected flow gets a `positive` border + check badge in the corner
- `editMode` makes the cards clickable and toggles `requireConfirmation` accordingly (default flow = `false`, strict flow = `true`)
- Two-way `v-model:require-confirmation` for the chosen flow

## Usage

### Read-only — info button only

```vue
<template>
  <ContentQuotationWorkflowInfo :require-confirmation="quotation.requireConfirmation" />
</template>
```

### Edit mode — picker

```vue
<template>
  <FormItemSwitch
    :model-value="form.values.requireConfirmation"
    :label="$t('orders.require_confirmation')"
    @update:model-value="(v) => form.setFieldValue('requireConfirmation', v)"
  >
    <template #after-label>
      <ContentQuotationWorkflowInfo
        v-model:require-confirmation="form.values.requireConfirmation"
        edit-mode
      />
    </template>
  </FormItemSwitch>
</template>
```

## Props

### `editMode`

```ts
editMode?: boolean
```

When `true`, flow cards are clickable and `requireConfirmation` updates on click. When `false`, the sheet is read-only.

- **Default:** `false`

## v-model

### `requireConfirmation`

```ts
v-model:require-confirmation: boolean
```

`false` = default flow, `true` = strict flow. Drives which card is highlighted (and which flow is selectable in edit mode).

- **Default:** `false`

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`StatusBadge`](/components/StatusBadge) — every step badge
- Lucide icons: `Send`, `PackageCheck`, `ThumbsUp`, `CheckCheck`, `Minus`, `ArrowDown`, `Check`, `CircleHelp`
