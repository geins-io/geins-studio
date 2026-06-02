# `StatusBadge`

`StatusBadge` renders a colored badge for any entity status — mapping a `StatusBadgeStatus` value to a [`Badge`](/components/shadcn-vue) variant and a localized label.

## Features

- Maps order, quotation, account, and health statuses to a single shared variant palette
- Auto-localizes boolean (`true`/`false`) to "Active" / "Inactive" via `useI18n`
- Falls back to a sentence-cased version of the raw status string for unknown values

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const status = 'pending';
</script>

<template>
  <StatusBadge :status="status" />
</template>
```

For boolean active flags:

```vue
<template>
  <StatusBadge :status="entity.active" />
</template>
```

## Props

### `status`

```ts
status: StatusBadgeStatus
```

The status value to render. Drives both the badge variant (color) and the displayed label.

- **Type:** `StatusBadgeStatus`
- **Required:** yes

## Type Definitions

```ts
type StatusBadgeStatus =
  | 'pending'
  | 'on-hold'
  | 'backorder'
  | 'partial'
  | 'sent'
  | 'degraded'
  | 'canceled'
  | 'unhealthy'
  | 'rejected'
  | 'refunded'
  | 'inactive'
  | 'idle'
  | 'finalized'
  | 'healthy'
  | 'enabled'
  | 'accepted'
  | 'completed'
  | 'confirmed'
  | 'draft'
  | boolean
  | string;
```

The exact union is defined in `shared/types`. `boolean` values render the localized "Active" / "Inactive" label. Any other string falls through to `outline` variant with a sentence-cased label.

## Dependencies

- shadcn-vue [`Badge`](/components/shadcn-vue) — visual primitive
- `useI18n` — localizes the boolean labels
