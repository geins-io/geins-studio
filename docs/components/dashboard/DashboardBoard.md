# `DashboardBoard`

The start dashboard's grid: 12 columns, 28px rows, 16px gaps, widgets placed by their `layout` entry and compacted upwards. Built on [`grid-layout-plus`](https://grid-layout-plus.netlify.app/). Each widget renders its own [`DashboardWidget`](/components/dashboard/DashboardWidget.md) frame.

## How it works

- `items` (what's on the board) and `layout` (where) are matched by `i`. A layout entry without a matching item is skipped.
- Each widget type maps to its component in `WIDGET_COMPONENTS`. The map is a `Record<DashboardWidgetType, Component>`, so a type added to the registry without a component is a type error.
- **Editing** (`editing`): widgets drag by their header (only elements with `dashboard-widget-handle`, which [`DashboardWidget`](/components/dashboard/DashboardWidget.md) puts on its header while editing, start a drag; buttons inside it don't) and resize from the bottom-right corner, snapping to the grid. The board provides `DASHBOARD_BOARD_CONTEXT` (`editing`, `remove`, `fit`, `updateConfig`) to the widgets inside it; a widget's ✕ calls `remove`, which the board emits as `remove` with the widget's `i`.
- The drop placeholder and resize corner use the `--link` color through grid-layout-plus's `--vgl-*` variables (its default is red).
- Minimum sizes come from the widget registry (`DASHBOARD_WIDGETS` in `app/lib/dashboard.ts`), not from the stored layout.
- **Fitting widgets** (registry `fit`): the widget's height is the one it reports, so its minimum and maximum height are both its current `h` and the corner resizes only the width. A widget reports through the context's `fit(i, h)`, which the board emits as `fit`; the page passes it to `useDashboard().fitWidget`.
- **Widget settings**: a widget stores its own settings through the context's `updateConfig(i, config)`, which the board emits as `update-config`; the page passes it to `useDashboard().updateWidgetConfig`, which saves right away.
- The grid puts its gap outside the outer widgets too and has no container padding option, so the board sits in a `-m-4` wrapper to line up with the page.
- **Stacked** (`stacked`, set by the page when the board is narrower than `DASHBOARD_STACK_BELOW`, 640px): one widget per row in reading order (`stackedOrder`: top to bottom, then left to right). A widget's height is its registry `stackedHeight`, `auto` (the content decides), or its grid height in px (`rowsToPixels`).

## Usage

```vue
<script setup lang="ts">
const { items, layout, editing, removeWidget, fitWidget, updateWidgetConfig } =
  useDashboard();
</script>

<template>
  <DashboardBoard
    v-model:layout="layout"
    :items="items"
    :stacked="stacked"
    :editing="editing"
    @remove="removeWidget"
    @fit="fitWidget"
    @update-config="updateWidgetConfig"
  />
</template>
```

## Props

| Prop      | Type                        | Meaning                                    |
| --------- | --------------------------- | ------------------------------------------ |
| `items`   | `DashboardWidgetInstance[]` | The widgets on the board                   |
| `layout`  | `DashboardLayoutItem[]`     | `v-model:layout`, grid position per widget |
| `stacked` | `boolean`                   | One widget per row, no grid                |
| `editing` | `boolean`                   | Drag, resize and remove widgets            |

## Events

| Event           | Payload                                      | When                                       |
| --------------- | -------------------------------------------- | ------------------------------------------ |
| `remove`        | `i: string`                                  | A widget's ✕ was clicked                   |
| `fit`           | `i: string, h: number`                       | A fitting widget needs `h` grid rows       |
| `update-config` | `i: string, config: Record<string, unknown>` | A widget saved its settings (e.g. a panel) |

## Adding a widget

1. Add its type to `DashboardWidgetType` (`shared/types/Dashboard.ts`).
2. Add its definition to `DASHBOARD_WIDGETS` (`app/lib/dashboard.ts`): i18n keys, group, icon, sizes, variant, and `fit: true` if its height should follow its content.
3. Create `app/components/dashboard/widget/DashboardWidget{Name}.vue`: it takes `instance: DashboardWidgetInstance` and renders `<DashboardWidget :instance="instance">`.
4. Map the type to its `Lazy…` component in `WIDGET_COMPONENTS`.

See [Dashboard domain](/domains/dashboard.md) for what each widget reads.
