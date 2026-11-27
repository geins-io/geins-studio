# `DashboardWidget`

The frame every dashboard widget renders itself in: a card with a header (title, description, optional badge, actions) and a body. Title, description and variant come from the widget registry (`DASHBOARD_WIDGETS` in `app/lib/dashboard.ts`), looked up by the instance's `type`.

## Editing

While the board around it is edited (`DASHBOARD_BOARD_CONTEXT` from [`DashboardBoard`](/components/dashboard/DashboardBoard.md)), the header shows a grip and becomes the drag handle, a [`DashboardWidgetRemove`](/components/dashboard/DashboardWidgetRemove.md) ✕ sits at its right end, and the card gets a `--link` ring. A `bare` widget drags by the whole card and shows the ✕ in its top-right corner. Outside a board nothing is editable.

## Variants

The registry's `variant` decides the body:

| Variant   | Body                                                  |
| --------- | ----------------------------------------------------- |
| `default` | Padded, scrolls when the content is taller            |
| `flush`   | Less padding, no scroll (charts that fill the space)  |
| `table`   | No padding, scrolls: a full-width table fills it      |
| `bare`    | No header at all; the slot is the whole card (a tile) |

## Fitting the content

A widget registered with `fit: true` sizes its height to its content. Its content fills the body (a flex column), so the content's root can take `grow` and share out what's left under the whole grid rows: Quick access and Needs attention give their rows `1fr`, so the space above and below the tiles stays even instead of collecting at the bottom.

The rows needed come from the content at its **natural** height: `measure` switches the fill off (`flex-grow: 0`) for one synchronous read, never painted, and reads card, body and content together (card − body + content is the height needed). Measured filled, the content would always ask for the rows it already has. That height in grid rows (`pixelsToRows`, at least the registry `minH`) goes to the board's `fit(i, h)` whenever it changes. A `ResizeObserver` over body and content re-measures on resizes (e.g. the width changes the number of columns), and a `MutationObserver` on the content when its elements or their inline styles change (e.g. fewer shortcuts, or fewer Quick access columns), which a filled content doesn't resize for. It ignores `measure`'s own style toggle on the content. Works for the `default` and `flush` variants.

## Usage

```vue
<script setup lang="ts">
defineProps<{ instance: DashboardWidgetInstance }>();
</script>

<template>
  <DashboardWidget :instance="instance">
    <template #actions>
      <!-- icon buttons in the header, e.g. DashboardWidgetSettings -->
    </template>
    …
  </DashboardWidget>
</template>
```

## Props

| Prop          | Type                          | Meaning                                                                                                  |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `instance`    | `DashboardWidgetInstance`     | The widget; its `type` picks the registry entry, its `i` is what ✕ removes                               |
| `description` | `string`                      | Replaces the registry description, e.g. one per mode                                                     |
| `badge`       | `number`                      | A count next to the title (`danger` badge)                                                               |
| `viewAll`     | `string \| DashboardListLink` | Shows **View all** at the header's right end, linking to the full list; hidden while the board is edited |

## Slots

| Slot      | Content                                 |
| --------- | --------------------------------------- |
| default   | The widget body                         |
| `actions` | Right side of the header (icon buttons) |
