# `DashboardWidget`

The frame every dashboard widget renders itself in: a card with a header (title, description, optional badge, actions) and a body. Title, description and variant come from the widget registry (`DASHBOARD_WIDGETS` in `app/lib/dashboard.ts`), looked up by the instance's `type`.

While the board around it is edited (`DASHBOARD_BOARD_CONTEXT` from [`DashboardBoard`](/components/dashboard/DashboardBoard.md)), the header shows a grip and becomes the drag handle, a [`DashboardWidgetRemove`](/components/dashboard/DashboardWidgetRemove.md) ✕ sits at its right end, and the card gets a `--link` ring. A `bare` widget drags by the whole card and shows the ✕ in its top-right corner. Outside a board nothing is editable.

## Variants

The registry's `variant` decides the body:

| Variant   | Body                                                  |
| --------- | ----------------------------------------------------- |
| `default` | Padded, scrolls when the content is taller            |
| `flush`   | Less padding, no scroll (charts that fill the space)  |
| `table`   | No padding, scrolls: a full-width table fills it      |
| `bare`    | No header at all; the slot is the whole card (a tile) |

## Usage

```vue
<script setup lang="ts">
defineProps<{ instance: DashboardWidgetInstance }>();
</script>

<template>
  <DashboardWidget :instance="instance">
    <template #actions>
      <!-- icon buttons in the header, e.g. settings -->
    </template>
    …
  </DashboardWidget>
</template>
```

## Props

| Prop          | Type                      | Meaning                                                                    |
| ------------- | ------------------------- | -------------------------------------------------------------------------- |
| `instance`    | `DashboardWidgetInstance` | The widget; its `type` picks the registry entry, its `i` is what ✕ removes |
| `description` | `string`                  | Replaces the registry description, e.g. one per mode                       |
| `badge`       | `number`                  | A count next to the title (`danger` badge)                                 |

## Slots

| Slot      | Content                                 |
| --------- | --------------------------------------- |
| default   | The widget body                         |
| `actions` | Right side of the header (icon buttons) |
