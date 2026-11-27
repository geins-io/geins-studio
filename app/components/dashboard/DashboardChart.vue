<script setup lang="ts">
import {
  VisArea,
  VisAxis,
  VisCrosshair,
  VisLine,
  VisScatter,
  VisStackedBar,
  VisTooltip,
  VisXYContainer,
} from '@unovis/vue';
import { h, render } from 'vue';
import type { DashboardChartPoint, DashboardChartSeries } from '#shared/types';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartTooltipContent } from '#components';

/**
 * A dashboard chart over time (shadcn-vue Chart on Unovis): a line or bars.
 * One series draws as an area with a soft gradient under the line; several
 * draw one line each, or stack in the bars. Hovering shows every series'
 * value for that step.
 */
const props = defineProps<{
  points: DashboardChartPoint[];
  series: DashboardChartSeries[];
  kind: 'line' | 'bar';
  /** The value in the tooltip, in full */
  formatValue: (value: number) => string;
  /** A y axis tick, kept short (12K) */
  formatTick: (value: number) => string;
}>();

type Datum = { index: number } & Record<string, number>;

const data = computed<Datum[]>(() =>
  props.points.map((point, index) => ({ index, ...point.values })),
);

const config = computed<ChartConfig>(() =>
  Object.fromEntries(
    props.series.map((s) => [s.key, { label: s.label, color: s.color }]),
  ),
);

const x = (d: Datum) => d.index;
const ys = computed(() => props.series.map((s) => (d: Datum) => d[s.key] ?? 0));
const colors = computed(() => props.series.map((s) => s.color));
const seriesColor = (_: unknown, i: number) => colors.value[i] ?? '';
const single = computed(() => props.series.length === 1);

// One step (January in YTD, a Monday in This week) is a zero-length line,
// which draws nothing: centre it on a domain of its own and mark it with a dot
const lonePoint = computed(() => props.points.length === 1);
const xDomain = computed<[number, number] | undefined>(() =>
  lonePoint.value ? [-0.5, 0.5] : undefined,
);

const gradientId = `dashboard-chart-${useId()}`;
const svgDefs = computed(() => {
  const color = colors.value[0];
  return `<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" style="stop-color: ${color}; stop-opacity: 0.18" />
    <stop offset="100%" style="stop-color: ${color}; stop-opacity: 0" />
  </linearGradient>`;
});

// At most about eight x labels, on whole steps; the axis would otherwise ask
// for fractional ticks between them
const xTicks = computed(() => {
  const count = props.points.length;
  const step = Math.max(1, Math.ceil(count / 8));
  return Array.from({ length: count }, (_, i) => i).filter(
    (i) => i % step === 0,
  );
});
const xTick = (tick: number | Date) => props.points[Number(tick)]?.label ?? '';
const yTick = (tick: number | Date) => props.formatTick(Number(tick));

// Rendered fresh on each hover: the chart helper's cached `componentToString`
// keys only on the values, so two steps with the same values would share a title
function tooltip(d: Datum) {
  const point = props.points[d.index];
  if (!point) return '';
  const payload = Object.fromEntries(
    props.series.map((s) => [s.key, props.formatValue(d[s.key] ?? 0)]),
  );
  const el = document.createElement('div');
  render(
    h(ChartTooltipContent, {
      payload,
      config: config.value,
      x: d.index,
      labelFormatter: () => point.title,
    }),
    el,
  );
  const html = el.innerHTML;
  render(null, el);
  return html;
}
</script>

<template>
  <ChartContainer :config="config" cursor class="dashboard-chart aspect-auto">
    <VisXYContainer
      :data="data"
      :svg-defs="svgDefs"
      :margin="{ top: 8, right: 8 }"
      :x-domain="xDomain"
      :y-domain="[0, undefined]"
    >
      <template v-if="kind === 'line'">
        <VisArea
          v-if="single"
          :x="x"
          :y="ys[0]"
          :color="`url(#${gradientId})`"
          curve-type="monotoneX"
        />
        <VisLine
          :x="x"
          :y="ys"
          :color="seriesColor"
          :line-width="2.5"
          curve-type="monotoneX"
        />
        <template v-if="lonePoint">
          <VisScatter
            v-for="(y, i) in ys"
            :key="series[i]?.key"
            :x="x"
            :y="y"
            :color="colors[i]"
            :size="8"
          />
        </template>
      </template>
      <VisStackedBar
        v-else
        :x="x"
        :y="ys"
        :color="seriesColor"
        :rounded-corners="4"
        :bar-max-width="38"
        :bar-padding="0.2"
      />
      <VisAxis
        type="x"
        :x="x"
        :tick-values="xTicks"
        :tick-format="xTick"
        :tick-line="false"
        :domain-line="false"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :tick-format="yTick"
        :num-ticks="4"
        :tick-line="false"
        :domain-line="false"
      />
      <VisTooltip />
      <VisCrosshair :template="tooltip" :color="seriesColor" />
    </VisXYContainer>
  </ChartContainer>
</template>

<style scoped>
.dashboard-chart {
  --vis-axis-grid-color: var(--border);
  --vis-axis-grid-line-dasharray: 3 3;
  --vis-axis-tick-label-font-size: 11px;
}
</style>
