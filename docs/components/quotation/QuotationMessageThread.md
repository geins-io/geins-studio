# `QuotationMessageThread`

`QuotationMessageThread` renders the list of quotation messages for a single tab — avatars, author + timestamp, status-transition badges, reply excerpts, inline edit, and a per-message actions menu.

## Features

- Two layouts via `mode`:
  - `external` — sent messages right-aligned (`justify-end`), 4/5 width
  - `internal` — full-width, left-aligned
- Reply excerpts: messages with `answerRef` show a compact quoted preview that anchor-links to the parent message
- Inline edit: Edit action turns the message body into a `Textarea` with Cancel / Save
- Status transition rendering: messages tagged with `statusFrom` / `statusTo` / `action` show the action label and a badge transition (`<from> → <to>`)
- Owner-only Edit/Delete actions — gated by `currentUserEmail === msg.authorId`
- Empty state per mode — no external / no internal messages
- Parent-driven edit-loading: `editLoading` toggles the Save button spinner; clearing it auto-exits edit mode

## Usage

```vue
<template>
  <QuotationMessageThread
    mode="external"
    :messages="externalMessages"
    :all-communications="allMessages"
    :current-user-email="user.email"
    :edit-loading="editLoading"
    @reply="(msg) => (replyTo = msg)"
    @edit="onEdit"
    @delete="onDelete"
  />
</template>
```

## Props

### `messages`

```ts
messages: QuotationMessage[]
```

Messages to render in this thread.

### `allCommunications`

```ts
allCommunications?: QuotationMessage[]
```

Full message list — used to look up parents by `answerRef` even when the parent is in the other tab.

- **Default:** `[]`

### `currentUserEmail`

```ts
currentUserEmail?: string
```

Required for the Edit/Delete actions to render. When empty, no actions menu is shown.

- **Default:** `''`

### `mode`

```ts
mode?: 'external' | 'internal'
```

Layout variant.

- **Default:** `'internal'`

### `editLoading`

```ts
editLoading?: boolean
```

Spinner state on the inline edit Save button. Setting back to `false` while in edit mode auto-exits edit.

- **Default:** `false`

## Events

### `reply`

```ts
(message: QuotationMessage): void
```

### `edit`

```ts
(messageId: string, newText: string): void
```

### `delete`

```ts
(messageId: string): void
```

## Dependencies

- shadcn-vue `Avatar`, `AvatarFallback`, [`DropdownMenu`](/components/shadcn-vue), `Button`, `Textarea`, `Empty`
- [`StatusBadge`](/components/StatusBadge)
- [`useDate`](/composables/useDate) — `formatDate` on each timestamp
