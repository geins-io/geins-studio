# `DialogStatusTransition`

`DialogStatusTransition` is the confirmation dialog for status transitions in the quotation lifecycle — send, accept, reject, cancel, expire, convert-to-order. It is **specific to the quotation flow** and is not used for other entities. Bundles message composition, an optional date picker, and block-reason warnings into a single primitive.

## Features

- Title, description, and confirm action label provided per-call
- Optional message field with `Tabs` to switch between "Message to customer" and "Internal note"
- Optional `FormInputDate` for transitions that need a target date (e.g. expiration)
- Block-reason list rendered through `Feedback` — disables confirm when present
- Six built-in icon variants (`send`, `check`, `x`, `ban`, `shopping-cart`, `calendar-plus`)
- `default` and `destructive` button variants
- Resets state when the dialog opens/closes

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { QuotationMessageType } from '#shared/types';

const open = ref(false);
const loading = ref(false);

const onConfirm = async (
  message: string | undefined,
  messageType: QuotationMessageType,
  validTo?: string,
) => {
  loading.value = true;
  await sendQuotation({ message, messageType, validTo });
  loading.value = false;
  open.value = false;
};
</script>

<template>
  <DialogStatusTransition
    v-model:open="open"
    :action="$t('orders.send')"
    :title="$t('orders.send_quotation_title')"
    :description="$t('orders.send_quotation_description')"
    :loading="loading"
    icon="send"
    show-date-picker
    :date-picker-label="$t('expiration_date')"
    @confirm="onConfirm"
    @cancel="open = false"
  />
</template>
```

### Blocked transition

When the entity can't transition (missing fields, invalid state), pass `blockReasons` to disable the confirm button and surface the reasons:

```vue
<template>
  <DialogStatusTransition
    v-model:open="open"
    :action="$t('orders.send')"
    :title="$t('orders.send_quotation_title')"
    :description="$t('orders.send_quotation_description')"
    :loading="loading"
    :block-reasons="['Customer email missing', 'No products in cart']"
    @confirm="onConfirm"
    @cancel="open = false"
  />
</template>
```

## Props

### `action`

```ts
action: string
```

Label for the confirm button (e.g. `'Send'`, `'Accept'`).

### `title`

```ts
title: string
```

Dialog title.

### `description`

```ts
description: string
```

Body text shown under the title.

### `loading`

```ts
loading: boolean
```

Disables the confirm button and shows a spinner.

### `showMessage`

```ts
showMessage?: boolean
```

Renders the message tabs + textarea.

- **Default:** `true`

### `showDatePicker`

```ts
showDatePicker?: boolean
```

Renders a date picker bounded by today as the minimum. When `true`, confirm is disabled until a date is selected.

- **Default:** `false`

### `datePickerLabel`

```ts
datePickerLabel?: string
```

Override the date picker label. Falls back to `$t('expiration_date')`.

### `defaultMessageType`

```ts
defaultMessageType?: QuotationMessageType
```

Which message tab is selected by default.

- **Default:** `'internal'`

### `variant`

```ts
variant?: 'default' | 'destructive'
```

Confirm button style. Use `'destructive'` for reject / cancel transitions.

- **Default:** `'default'`

### `icon`

```ts
icon?: 'send' | 'check' | 'x' | 'ban' | 'shopping-cart' | 'calendar-plus'
```

Optional icon shown to the left of the action label.

### `blockReasons`

```ts
blockReasons?: string[]
```

When present and non-empty, replaces the message and date inputs with a `Feedback` warning listing each reason, and disables confirm.

## v-model

### `open`

```ts
v-model:open: boolean
```

Controls dialog visibility.

## Events

### `confirm`

```ts
(message: string | undefined, messageType: QuotationMessageType, validTo?: string): void
```

Emitted on confirm with the entered message, the active message tab, and the selected date (if shown).

### `cancel`

Emitted when the user clicks Cancel.

## Type Definitions

```ts
type TransitionIcon =
  | 'send'
  | 'check'
  | 'x'
  | 'ban'
  | 'shopping-cart'
  | 'calendar-plus';

interface DialogStatusTransitionProps {
  action: string;
  title: string;
  description: string;
  loading: boolean;
  showMessage?: boolean;
  showDatePicker?: boolean;
  datePickerLabel?: string;
  defaultMessageType?: QuotationMessageType;
  variant?: 'default' | 'destructive';
  icon?: TransitionIcon;
  blockReasons?: string[];
}
```

## Dependencies

- shadcn-vue [`AlertDialog`](/components/shadcn-vue), `Tabs`, `Textarea`, `Label`
- `Feedback` for block-reason rendering — see `app/components/feedback/Feedback.vue`
- `FormInputDate` for the optional date picker — see `app/components/form/input/FormInputDate.vue`
