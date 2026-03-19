---
title: 'Implement Payments tab card with enable/disable toggles wired to channel edit'
project: 'Self Service (Channels)'
milestone: 'M5 — Payments Tab'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './001-payment-types-and-repository.md'
  - './002-channel-payment-row-component.md'
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

The Payments tab is the fourth tab on the channel edit page. It shows all payment methods available for this channel and lets the user enable or disable each one. All mutations accumulate in local state and persist via the single `PATCH /account/channel/{id}` when the user hits Save — the same write surface as languages and markets. This issue wires the tab into the existing `useEntityEdit` pattern and ensures `hasUnsavedChanges` tracks toggle changes correctly.

## Expected Outcome

1. A `app/components/channel/ChannelPaymentsTab.vue` component that:
   - Renders a `ContentEditCard` titled `t('channel.payments')`.
   - Lists all payment methods using `ChannelPaymentRow`, separated by `divide-y`.
   - Shows an empty state when no payment methods exist.
   - Exposes `v-model:payments` for two-way binding with the page.

2. The "Payments" tab in `app/pages/store/channel/[id].vue` renders `ChannelPaymentsTab` and:
   - Loads `paymentMethods` from the channel GET response inside `parseEntityData`.
   - Syncs toggle changes to `entityDataUpdate.paymentMethods` via a dedicated watcher.
   - `hasUnsavedChanges` becomes `true` after any toggle change.

## Implementation Notes

### Component: `ChannelPaymentsTab.vue`

```ts
const props = defineProps<{
  payments: ChannelPayment[]
}>()
const emit = defineEmits<{
  'update:payments': [payments: ChannelPayment[]]
}>()
```

- On `ChannelPaymentRow` `onChange(id, active)`: clone the `payments` array, update the matching entry's `active` field, emit `update:payments` with the new array.
- Pass `onChange` as a closure that captures the payment `_id`: `(active) => handleToggle(payment._id, active)`.
- No API calls in this component — it is purely presentational + local state delegation.

**Empty state**: When `payments.length === 0`, render an inline empty state message: `t('channel.no_payment_methods')`.

**Loading state**: Accept a `loading?: boolean` prop. When `true`, render 3–4 skeleton rows using `<Skeleton>` (height matching a payment row) instead of the payment list.

### Page integration (`app/pages/store/channel/[id].vue`)

**Local ref:**

```ts
const channelPayments = ref<ChannelPayment[]>([])
```

**`parseEntityData`** (called after GET response is received):

```ts
channelPayments.value = entity.paymentMethods ?? []
```

**Watcher** (sync local state → `entityDataUpdate`):

```ts
watch(
  channelPayments,
  (payments) => {
    entityDataUpdate.value.paymentMethods = payments.map(p => ({
      paymentId: p._id,
      active: p.active,
    }))
  },
  { deep: true },
)
```

This watcher fires on every toggle, causing `useEntityEdit`'s unsaved-changes detection to pick up the diff against `originalData`.

**Tab rendering:**

```html
<ChannelPaymentsTab
  v-model:payments="channelPayments"
  :loading="pending"
/>
```

### `onFormValuesChange` note

Payment methods are not form fields — they live in a standalone `ref`. The watcher above is the correct mechanism; do not add payments to `onFormValuesChange`.

### Data flow summary

```
GET response
  └─ parseEntityData → channelPayments (ref)
                          └─ watch → entityDataUpdate.paymentMethods
                                         └─ PATCH on Save
```

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:

- `channel.payments` — card title: `"Payments"`
- `channel.no_payment_methods` — empty state: `"No payment methods available for this channel."`

## Acceptance Criteria

- `ChannelPaymentsTab` renders one `ChannelPaymentRow` per entry in `payments`.
- Toggling a payment switch updates the emitted `payments` array with the new `active` value for that payment's `_id`.
- `hasUnsavedChanges` is `true` after any toggle; `false` on initial load.
- `entityDataUpdate.paymentMethods` reflects the current toggle state as `ChannelPaymentUpdate[]` (with `paymentId` + `active`).
- Empty state is shown when `payments` is empty.
- Loading skeletons are shown when `loading` is `true`.
- The Payments tab is visible in the tab bar of `[id].vue` and renders `ChannelPaymentsTab`.
- Payments state is loaded from the channel GET response in `parseEntityData`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that toggling a payment emits an updated array with the correct `active` value; test that the watcher correctly maps `channelPayments` to `entityDataUpdate.paymentMethods` as `ChannelPaymentUpdate[]`; test that `hasUnsavedChanges` is triggered after a toggle; test that empty state renders when `payments` is an empty array.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Multi-file feature requiring careful wiring of local state, `useEntityEdit` patterns, and reactivity — straightforward enough for autonomous sonnet execution, but spans the component and the page.
