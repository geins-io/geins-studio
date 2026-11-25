# `DashboardBoard`

The start dashboard's grid: 12 columns, 28px rows, 16px gaps, widgets placed by their `layout` entry and compacted upwards. Built on [`grid-layout-plus`](https://grid-layout-plus.netlify.app/). Each widget renders its own [`DashboardWidget`](/components/dashboard/DashboardWidget.md) frame.

## How it works

- `items` (what's on the board) and `layout` (where) are matched by `i`. A layout entry without a matching item is skipped.
- Each widget type maps to its component in `WIDGET_COMPONENTS`. The map is a `Record<DashboardWidgetType, Component>`, so a type added to the registry without a component is a type error.
- Minimum sizes come from the widget registry (`DASHBOARD_WIDGETS` in `app/lib/dashboard.ts`), not from the stored layout.
- The grid puts its gap outside the outer widgets too and has no container padding option, so the board sits in a `-m-4` wrapper to line up with the page.
- **Stacked** (`stacked`, set by the page when the board is narrower than `DASHBOARD_STACK_BELOW`, 640px): one widget per row in reading order (`stackedOrder`: top to bottom, then left to right). A widget's height is its registry `stackedHeight`, `auto` (the content decides), or its grid height in px (`rowsToPixels`).

## Usage

```vue
<script setup lang="ts">
const { items, layout } = useDashboard();
</script>

<template>
  <DashboardBoard v-model:layout="layout" :items="items" :stacked="stacked" />
</template>
```

## Props

| Prop      | Type                        | Meaning                                    |
| --------- | --------------------------- | ------------------------------------------ |
| `items`   | `DashboardWidgetInstance[]` | The widgets on the board                   |
| `layout`  | `DashboardLayoutItem[]`     | `v-model:layout`, grid position per widget |
| `stacked` | `boolean`                   | One widget per row, no grid                |

## Adding a widget

1. Add its type to `DashboardWidgetType` (`shared/types/Dashboard.ts`).
2. Add its definition to `DASHBOARD_WIDGETS` (`app/lib/dashboard.ts`): i18n keys, group, icon, sizes, variant.
3. Create `app/components/dashboard/widget/DashboardWidget{Name}.vue`: it takes `instance: DashboardWidgetInstance` and renders `<DashboardWidget :type="instance.type">`.
4. Map the type to its `Lazy…` component in `WIDGET_COMPONENTS`.

See [Dashboard domain](/domains/dashboard.md) for what each widget reads.
