# `ContentTextCopy`

An inline button that copies its value to the clipboard on click. Provides animated icon feedback and a toast confirmation.

## Features

- Copies `String(value)` to the clipboard via the Clipboard API
- Animated icon swap: `LucideCopy` → `LucideCopyCheck` on success, resets after 5 seconds
- Positive toast notification with the field label
- Slot content acts as the visual label

## Usage

### Basic Usage

```vue
<template>
  <ContentTextCopy label="Order ID" value="ORD-123">
    ORD-123
  </ContentTextCopy>
</template>
```

### Inside ContentDataList

`ContentDataList` uses `ContentTextCopy` automatically when `DataItemDisplayType.Copy` is set:

```ts
const items = [
  {
    label: 'API Key',
    value: 'abc-123',
    displayType: DataItemDisplayType.Copy,
  },
]
```

## Props

### `label`

```ts
label?: string
```

- **Type:** `string`
- **Description:** Field name shown in the toast message (`'Copied {label} to clipboard'`).

### `value`

```ts
value: unknown
```

- **Type:** `unknown`
- **Required:** yes
- **Description:** Value to copy. Converted to string via `String(value)` before writing to the clipboard.

## Slots

### default

The display content shown inside the button (usually the human-readable version of `value`).

## Dependencies

- shadcn-vue `useToast` — clipboard confirmation toast
