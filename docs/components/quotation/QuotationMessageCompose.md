# `QuotationMessageCompose`

`QuotationMessageCompose` is the textarea + Send button below a quotation message thread — handles the reply-to chip, Enter-to-send, and parent-driven clearing after a successful save.

## Features

- Multiline `Textarea` with placeholder driven by `messageType`
- `Enter` (without modifiers) sends; `Shift + Enter` for a newline
- Reply chip shown when `replyTo` is set, with an X to clear
- Send button is disabled when empty or loading
- Parent-driven clear: `clearTrigger` is a counter — increment it externally to wipe the input after a successful save (also fires `cancelReply`)

## Usage

```vue
<script setup lang="ts">
const messageText = ref('');
const sending = ref(false);
const clearTrigger = ref(0);
const replyTo = ref<QuotationMessage | null>(null);

const onSend = async (text: string) => {
  sending.value = true;
  await api.sendMessage(text);
  sending.value = false;
  clearTrigger.value++;
};
</script>

<template>
  <QuotationMessageCompose
    message-type="toCustomer"
    :loading="sending"
    :reply-to="replyTo"
    :clear-trigger="clearTrigger"
    @send="onSend"
    @cancel-reply="replyTo = null"
  />
</template>
```

## Props

### `messageType`

```ts
messageType: QuotationMessageType  // 'toCustomer' | 'fromCustomer' | 'internal'
```

Drives the placeholder copy.

### `loading`

```ts
loading?: boolean
```

Disables the Send button and shows a spinner.

- **Default:** `false`

### `replyTo`

```ts
replyTo?: QuotationMessage | null
```

When set, renders a "Replying to {author}" chip above the textarea.

- **Default:** `null`

### `clearTrigger`

```ts
clearTrigger?: number
```

Increment on the parent to clear the textarea after a successful send (also emits `cancelReply`).

- **Default:** `0`

## Events

### `send`

```ts
(message: string): void
```

Emitted with the trimmed text. Parent owns the API call and the post-save `clearTrigger++`.

### `cancelReply`

Emitted when the user clicks the X next to the reply chip, or after a successful clear.

## Dependencies

- shadcn-vue [`Textarea`](/components/shadcn-vue), `Button`
