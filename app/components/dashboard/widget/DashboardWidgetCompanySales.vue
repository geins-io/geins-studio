<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import type {
  DashboardChartPoint,
  DashboardChartSeries,
  DashboardWidgetInstance,
} from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  dashboardChannelsInScope,
} from '@/lib/dashboard';
import {
  bucketSales,
  filterSalesOrders,
  previousSalesRange,
  salesBuckets,
  salesChange,
  salesChannelColor,
  salesChannelIds,
  salesChartKind,
  salesGranularity,
  salesRange,
  salesSplit,
  salesTotals,
  type SalesChartKind,
  type SalesGranularity,
  type SalesSplit,
} from '@/lib/dashboard-sales';
import { LucideChartColumn, LucideChartSpline } from '#components';

/**
 * Company sales: Demand (orders by the day they were placed) over the
 * dashboard's period, in its channels and currency. Key numbers with the
 * change against the period before, then a line or bar chart of the total
 * or split by channel. The header's info button explains Demand and Revenue.
 */
const props = defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t, locale } = useI18n();
const { formatDate } = useDate();
const { formatCurrency } = usePrice();
const board = inject(DASHBOARD_BOARD_CONTEXT, null);
const { channels } = storeToRefs(useAccountStore());

const { period, channelIds, currency } = useDashboardFilters();
const { orders, loading, error, refresh } = useDashboardCompanyOrders();

// "Now" for the buckets of a period that's still running and for "at this
// time" comparisons; a minute is fine enough for both
const { now: clock } = useLiveClock(true, 60_000);
const now = computed(() => new Date(clock.value));

const saveConfig = (change: Record<string, unknown>) =>
  board?.updateConfig(props.instance.i, {
    ...props.instance.config,
    ...change,
  });

const kind = computed({
  get: () => salesChartKind(props.instance.config),
  set: (value: SalesChartKind) => {
    if (value !== kind.value) saveConfig({ kind: value });
  },
});
const split = computed({
  get: () => salesSplit(props.instance.config),
  set: (value: SalesSplit) => {
    if (value !== split.value) saveConfig({ split: value });
  },
});
const splitOptions = computed(() => [
  { value: 'total', label: t('dashboards.sales.total') },
  { value: 'channel', label: t('dashboards.sales.by_channel') },
]);
const kindOptions = computed(() => [
  {
    value: 'line',
    label: t('dashboards.sales.line'),
    icon: LucideChartSpline,
  },
  { value: 'bar', label: t('dashboards.sales.bars'), icon: LucideChartColumn },
]);

const granularity = computed(() => salesGranularity(period.value));
const range = computed(() => salesRange(period.value, now.value));
const previous = computed(() => previousSalesRange(period.value, now.value));

const inScope = (from: Date, to: Date) =>
  filterSalesOrders(orders.value, {
    from,
    to,
    channelIds: channelIds.value,
    currency: currency.value,
  });
const current = computed(() => inScope(range.value.from, range.value.to));
const before = computed(() => inScope(previous.value.from, previous.value.to));

const totals = computed(() => salesTotals(current.value));
const previousTotals = computed(() => salesTotals(before.value));

// ── Formatting ──────────────────────────────────────────────────────────────

const money = (value: number) =>
  `${formatCurrency(Math.round(value))} ${currency.value}`;
const compact = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }),
);
const percent = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      style: 'percent',
      maximumFractionDigits: 0,
      signDisplay: 'exceptZero',
    }),
);
const signed = computed(
  () => new Intl.NumberFormat(locale.value, { signDisplay: 'exceptZero' }),
);

const TICK_FORMAT: Record<SalesGranularity, Intl.DateTimeFormatOptions> = {
  hour: { hour: '2-digit', minute: '2-digit' },
  day: { day: 'numeric', month: 'short' },
  month: { month: 'short' },
};
const TITLE_FORMAT: Record<SalesGranularity, Intl.DateTimeFormatOptions> = {
  hour: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  day: { weekday: 'short', day: 'numeric', month: 'short' },
  month: { month: 'long', year: 'numeric' },
};

// ── Key numbers ─────────────────────────────────────────────────────────────

type Tone = 'up' | 'down' | 'flat';
const toneOf = (change: number | null): Tone =>
  !change ? 'flat' : change > 0 ? 'up' : 'down';

const kpis = computed(() => {
  const cur = totals.value;
  const prev = previousTotals.value;
  const vs = t(`dashboards.sales.vs.${previous.value.comparison}`);
  const relative = (a: number, b: number) => {
    const change = salesChange(a, b);
    return {
      delta: change === null ? '—' : percent.value.format(change),
      tone: toneOf(change),
    };
  };
  const difference = cur.companies - prev.companies;
  return [
    {
      key: 'orders',
      label: t('order', 2),
      value: String(cur.orders),
      ...relative(cur.orders, prev.orders),
    },
    {
      key: 'order_value',
      label: t('dashboards.sales.order_value'),
      value: money(cur.value),
      ...relative(cur.value, prev.value),
    },
    {
      key: 'average_order_value',
      label: t('dashboards.sales.average_order_value'),
      value: money(cur.average),
      ...relative(cur.average, prev.average),
    },
    {
      key: 'companies_ordering',
      label: t('dashboards.sales.companies_ordering'),
      value: String(cur.companies),
      delta: signed.value.format(difference),
      tone: toneOf(difference),
    },
  ].map((kpi) => ({ ...kpi, vs }));
});

const TONE_CLASS: Record<Tone, string> = {
  up: 'text-tone-success',
  down: 'text-tone-danger',
  flat: 'text-muted-foreground',
};

// ── Chart ───────────────────────────────────────────────────────────────────

// By channel: the channels in scope in account order, then any other channel
// an order is in, so the parts add up to the total
const channelSeries = computed(() => {
  const scope = dashboardChannelsInScope(channels.value, channelIds.value);
  const names = new Map(
    scope.map((channel) => [channel._id, channel.name || channel.identifier]),
  );
  return salesChannelIds(
    current.value,
    scope.map((channel) => channel._id),
  ).map((id, index) => ({
    id,
    // Index keys: they name the chart's CSS variables, which an id might not suit
    key: `channel_${index}`,
    label: names.get(id) ?? id,
    color: salesChannelColor(index),
  }));
});

const series = computed<DashboardChartSeries[]>(() =>
  split.value === 'channel'
    ? channelSeries.value.map(({ key, label, color }) => ({
        key,
        label,
        color,
      }))
    : [
        {
          key: 'value',
          label: t('dashboards.sales.order_value'),
          color: 'var(--tone-success)',
        },
      ],
);

const points = computed<DashboardChartPoint[]>(() => {
  const buckets = salesBuckets(range.value, granularity.value);
  const crossesYears =
    range.value.from.getFullYear() !== range.value.to.getFullYear();
  const tick: Intl.DateTimeFormatOptions =
    granularity.value === 'month' && crossesYears
      ? { month: 'short', year: '2-digit' }
      : TICK_FORMAT[granularity.value];
  const byChannel = split.value === 'channel';
  return bucketSales(current.value, buckets).map((point) => ({
    label: formatDate(point.start, tick),
    title: formatDate(point.start, TITLE_FORMAT[granularity.value]),
    values: byChannel
      ? Object.fromEntries(
          channelSeries.value.map((s) => [s.key, point.channels[s.id] ?? 0]),
        )
      : { value: point.value },
  }));
});

const formatTick = (value: number) => compact.value.format(value);

// ── Layout ──────────────────────────────────────────────────────────────────

// Below this widget width the toggles get their own row and the key numbers
// go two by two, as in the prototype
const NARROW_BELOW = 680;
const root = useTemplateRef<HTMLElement>('root');
const { width } = useElementSize(root);
const narrow = computed(() => width.value > 0 && width.value < NARROW_BELOW);
</script>

<template>
  <DashboardWidget :instance="instance">
    <div ref="root" class="flex h-full flex-col">
      <Empty v-if="error" class="h-full gap-4 p-2 md:p-2">
        <EmptyHeader>
          <EmptyMedia variant="destructive">
            <LucideCircleAlert />
          </EmptyMedia>
          <EmptyTitle>
            {{ $t('error_fetching_entity', { entityKey: 'order' }, 2) }}
          </EmptyTitle>
          <EmptyDescription>
            {{ $t('error_empty_description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ButtonIcon icon="retry" variant="secondary" @click="refresh()">
            {{ $t('retry') }}
          </ButtonIcon>
        </EmptyContent>
      </Empty>
      <template v-else>
        <div
          :class="
            cn(
              'mb-3 flex shrink-0 gap-3 px-1',
              narrow ? 'flex-col-reverse' : 'items-start gap-4',
            )
          "
        >
          <dl
            :class="
              cn(
                'grid flex-1 gap-x-4 gap-y-3',
                narrow ? 'grid-cols-2' : 'grid-cols-4',
              )
            "
          >
            <div
              v-for="kpi in kpis"
              :key="kpi.key"
              class="min-w-0 border-l pl-3"
            >
              <dt class="text-muted-foreground truncate text-xs">
                {{ kpi.label }}
              </dt>
              <dd>
                <Skeleton v-if="loading" class="mt-1.5 h-6 w-20" />
                <template v-else>
                  <p
                    :class="
                      cn(
                        'mt-0.5 truncate font-medium whitespace-nowrap tabular-nums',
                        narrow ? 'text-lg' : 'text-xl',
                      )
                    "
                  >
                    {{ kpi.value }}
                  </p>
                  <p
                    :class="cn('mt-0.5 truncate text-xs', TONE_CLASS[kpi.tone])"
                  >
                    {{ kpi.delta }} {{ kpi.vs }}
                  </p>
                </template>
              </dd>
            </div>
          </dl>
          <div class="flex shrink-0 items-center justify-end gap-2">
            <DashboardToggle
              v-model="split"
              :options="splitOptions"
              :label="$t('dashboards.sales.split')"
            />
            <DashboardToggle
              v-model="kind"
              :options="kindOptions"
              :label="$t('dashboards.sales.chart_type')"
            />
          </div>
        </div>
        <ul
          v-if="split === 'channel' && !loading"
          class="mt-1 mb-4 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-t px-1 pt-3"
          :aria-label="$t('channel', 2)"
        >
          <li
            v-for="channel in channelSeries"
            :key="channel.key"
            class="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: channel.color }"
              aria-hidden="true"
            />
            {{ channel.label }}
          </li>
        </ul>
        <div class="min-h-0 flex-1">
          <Skeleton v-if="loading" class="size-full" />
          <Empty v-else-if="!current.length" class="h-full gap-4 p-2 md:p-2">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideChartSpline />
              </EmptyMedia>
              <EmptyTitle>
                {{ $t('no_entity', { entityKey: 'order' }, 2) }}
              </EmptyTitle>
              <EmptyDescription>
                {{ $t('dashboards.sales.empty_description') }}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
          <DashboardChart
            v-else
            :points="points"
            :series="series"
            :kind="kind"
            :format-value="money"
            :format-tick="formatTick"
          />
        </div>
      </template>
    </div>
    <template #info>
      <DashboardSalesInfo />
    </template>
  </DashboardWidget>
</template>
