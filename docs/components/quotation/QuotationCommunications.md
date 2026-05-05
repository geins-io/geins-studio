# `QuotationCommunications`

`QuotationCommunications` is the messages tab of a quotation — a `Tabs` shell with two threads (external messages with the customer + internal notes for the team) and a compose box per tab.

## Features

- Two tabs: **External** (`toCustomer` + `fromCustomer`) and **Internal** (`internal`) — each with its own [`QuotationMessageThread`](/components/quotation/QuotationMessageThread) + [`QuotationMessageCompose`](/components/quotation/QuotationMessageCompose)
- Tab badges show message counts
- Per-tab reply state — clicking Reply on a message threads through to the compose box
- Clears the compose box only after a successful send via the `messageSendSuccessCount` counter pattern (parent increments after each successful save)

## Usage

```vue
<script setup lang="ts">
import type { QuotationMessageType } from '#shared/types';

const messageSendSuccessCount = ref(0);

const sendMessage = async (
  type: QuotationMessageType,
  message: string,
  answerRef?: string,
) => {
  await api.sendMessage({ type, message, answerRef });
  messageSendSuccessCount.value++;
};
</script>

<template>
  <QuotationCommunications
    :communications="quotation.messages"
    :current-user-email="user.email"
    :loading="sending"
    :edit-loading="editing"
    :message-send-success-count="messageSendSuccessCount"
    @send-message="sendMessage"
    @edit-message="editMessage"
    @delete-message="deleteMessage"
  />
</template>
```

## Props

### `communications`

```ts
communications: QuotationMessage[]
```

All messages (external + internal). Filtered internally per tab.

### `currentUserEmail`

```ts
currentUserEmail?: string
```

Drives "is own message" detection — gates the Edit / Delete actions on a thread message.

- **Default:** `''`

### `loading`

```ts
loading?: boolean
```

Spinner state on the compose Send button.

- **Default:** `false`

### `editLoading`

```ts
editLoading?: boolean
```

Spinner state on the inline message-edit Save button.

- **Default:** `false`

### `messageSendSuccessCount`

```ts
messageSendSuccessCount?: number
```

Increment on the parent after a successful `sendMessage` resolves — triggers the compose box to clear.

- **Default:** `0`

## Events

### `sendMessage`

```ts
(type: QuotationMessageType, message: string, answerRef?: string): void
```

`type` is the tab's message type (`'toCustomer'` or `'internal'`). `answerRef` is the parent message id when replying.

### `editMessage`

```ts
(messageId: string, newText: string): void
```

### `deleteMessage`

```ts
(messageId: string): void
```

## Dependencies

- shadcn-vue [`Tabs`](/components/shadcn-vue), `TabsList`, `TabsTrigger`, `TabsContent`, `Badge`
- [`QuotationMessageThread`](/components/quotation/QuotationMessageThread), [`QuotationMessageCompose`](/components/quotation/QuotationMessageCompose)
