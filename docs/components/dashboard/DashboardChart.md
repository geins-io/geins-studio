# `DashboardChart`

A dashboard chart over time: a line or bars, drawn with shadcn-vue **Chart** (`app/components/ui/chart`, on [Unovis](https://unovis.dev)). Used by [Company sales](/components/dashboard/DashboardWidgetCompanySales.md). It fills its parent, so give the parent a height.

- **Line**: one series draws as an area with a soft gradient under the line (the series colour at 18% fading to nothing); several series draw one line each.
- **Bars**: one bar per step; several series stack in it, rounded on top.
- **One step** (January in YTD, a Monday in This week): a line of one point draws nothing, so the x axis centres it and each series gets a dot.
- The x axis is the step index; ticks show each point's `label`, at most about eight of them. The y axis starts at 0 with about four ticks through `formatTick` and dashed grid lines.
- Hovering shows a crosshair and the shadcn `ChartTooltipContent`: the point's `title` and every series' value through `formatValue`. The tooltip is rendered fresh on each hover, because the chart helper's cached `componentToString` keys on the values only and would give two steps with the same values the same title.
- Colours come from `series[].color`: theme tokens such as `var(--tone-success)`, never raw hex.

## Usage

```vue
<template>
  <div class="h-64">
    <DashboardChart
      :points="points"
      :series="[
        {
          key: 'value',
          label: t('dashboards.sales.order_value'),
          color: 'var(--tone-success)',
        },
      ]"
      kind="line"
      :format-value="(v) => `${formatCurrency(v)} SEK`"
      :format-tick="(v) => compact.format(v)"
    />
  </div>
</template>
```

## Props

| Prop          | Type                        | Meaning                                                              |
| ------------- | --------------------------- | -------------------------------------------------------------------- |
| `points`      | `DashboardChartPoint[]`     | One per step: tick `label`, tooltip `title`, `values` per series key |
| `series`      | `DashboardChartSeries[]`    | The series: `key` (in `values`), `label`, `color`                    |
| `kind`        | `'line' \| 'bar'`           | Line (area for one series) or bars (stacked)                         |
| `formatValue` | `(value: number) => string` | A value in the tooltip, in full                                      |
| `formatTick`  | `(value: number) => string` | A y axis tick, kept short (12K)                                      |
