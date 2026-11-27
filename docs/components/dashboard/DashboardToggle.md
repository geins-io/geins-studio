# `DashboardToggle`

A small segmented toggle for a dashboard widget's views: the header modes of [`DashboardWidget`](/components/dashboard/DashboardWidget.md) (Demand / Revenue), and the chart toggles in [Company sales](/components/dashboard/DashboardWidgetCompanySales.md) (line / bars). The picked option is a white segment on the `secondary` track, as in the prototype.

- An option with an `icon` shows only the icon, with its `label` as tooltip and accessible name.
- An option with a `disabledReason` is shown greyed out and can't be picked. It stays hoverable and focusable (`aria-disabled`, not `disabled`), so its tooltip can say why.
- Each button carries `aria-pressed`; the group has `role="group"` and `label` as its name.

## Usage

```vue
<script setup lang="ts">
import { LucideChartColumn, LucideChartSpline } from '#components';

const kind = ref('line');
const options = [
  { value: 'line', label: t('dashboards.sales.line'), icon: LucideChartSpline },
  { value: 'bar', label: t('dashboards.sales.bars'), icon: LucideChartColumn },
];
</script>

<template>
  <DashboardToggle
    v-model="kind"
    :options="options"
    :label="t('dashboards.sales.chart_type')"
  />
</template>
```

## Props

| Prop         | Type                      | Meaning                      |
| ------------ | ------------------------- | ---------------------------- |
| `modelValue` | `string`                  | The picked option's `value`  |
| `options`    | `DashboardToggleOption[]` | The choices, in order        |
| `label`      | `string`                  | Accessible name of the group |

`DashboardToggleOption` (`#shared/types`): `value`, `label`, optional `icon` (a component) and `disabledReason`.
