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
status: StatusBadgeStatus;
```

The status value to render. Drives both the badge variant (color) and the displayed label.

- **Type:** `StatusBadgeStatus`
- **Required:** yes

### `label`

```ts
label?: string;
```

Translated text to show instead of the sentence-cased status. Pass it whenever the status isn't a boolean, so the label is localized — e.g. the background jobs panel renders `<StatusBadge status="in-progress" :label="$t('background_jobs.in_progress')" />`.

- **Type:** `string`
- **Required:** no

## Colors

The status picks a `Badge` variant from the status tones (see [Colors](/guides/ui/colors)), through `statusBadgeVariant()` in `app/utils/status-badge.ts`. Seen from the seller: info is the seller's turn, warning needs attention, neutral is idle.

| Variant         | Statuses                                                   |
| --------------- | ---------------------------------------------------------- |
| `positive`      | `completed`, `confirmed`, `true` (Active)                  |
| `success`       | `accepted`, `enabled`, `healthy`                           |
| `success-solid` | `finalized`                                                |
| `info`          | `pending`, `sent`, `partial`, `in-progress`                |
| `info-solid`    | `requested`                                                |
| `warning`       | `expired`, `on-hold`, `backorder`, `degraded`              |
| `danger`        | `canceled`, `cancelled`, `rejected`, `unhealthy`, `failed` |
| `neutral`       | `inactive`, `false`, `refunded`, `revised`, `idle`, others |
| `draft`         | `draft`                                                    |

A new value in `StatusBadgeKnownStatus` fails typecheck until it gets a variant.

## Type Definitions

```ts
type StatusBadgeStatus = boolean | StatusBadgeKnownStatus | string;
```

The known statuses are defined in `shared/types/Global.ts`. `boolean` values render the localized "Active" / "Inactive" label. Any other string renders `neutral` with a sentence-cased label.

## Dependencies

- shadcn-vue [`Badge`](/components/shadcn-vue) — visual primitive
- `useI18n` — localizes the boolean labels
