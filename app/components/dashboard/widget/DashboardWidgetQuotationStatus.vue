<script setup lang="ts">
import { VisDonut, VisSingleContainer } from '@unovis/vue';
import type { DashboardWidgetInstance } from '#shared/types';
import type { ChartConfig } from '@/components/ui/chart';
import { DASHBOARD_BOARD_CONTEXT } from '@/lib/dashboard';
import {
  QUOTATION_STATUS_SLICES,
  quotationStatusSummary,
} from '@/lib/dashboard-data';
import type {
  QuotationStatusSlice,
  QuotationStatusSliceDefinition,
} from '@/lib/dashboard-data';
import { quotationListLink } from '@/lib/list-url-filters';
import { NuxtLink } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t, locale } = useI18n();
const { quotations, loading, error, refresh } = useDashboardQuotations({
  scoped: true,
});
const board = inject(DASHBOARD_BOARD_CONTEXT, null);
const editing = computed(() => board?.editing.value ?? false);

const summary = computed(() => quotationStatusSummary(quotations.value));

// The badges' tones; a faded slice is its tone at lower opacity, as in the prototype
const sliceColor = ({ tone, faded }: QuotationStatusSliceDefinition) =>
  faded
    ? `color-mix(in srgb, var(--tone-${tone}) 45%, transparent)`
    : `var(--tone-${tone})`;

const chartConfig = computed(
  (): ChartConfig =>
    Object.fromEntries(
      QUOTATION_STATUS_SLICES.map((slice) => [
        slice.key,
        { label: statusBadgeLabel(slice.key), color: sliceColor(slice) },
      ]),
    ),
);

const ringSlices = computed(() =>
  summary.value.slices.filter((slice) => slice.count > 0),
);
const sliceValue = (slice: QuotationStatusSlice) => slice.count;
const sliceFill = (slice: QuotationStatusSlice) => `var(--color-${slice.key})`;

const legend = computed(() =>
  summary.value.slices.map((slice) => ({
    key: slice.key,
    label: statusBadgeLabel(slice.key),
    color: sliceColor(slice),
    share: slice.share,
    to: quotationListLink({ statuses: slice.statuses }),
  })),
);

const percent = computed(
  () =>
    new Intl.NumberFormat(locale.value, {
      style: 'percent',
      maximumFractionDigits: 0,
    }),
);
const formatRate = (rate: number | null) =>
  rate === null ? '–' : percent.value.format(rate);

const rates = computed(() => [
  {
    key: 'win_rate',
    label: t('dashboards.widgets.quotation_status.win_rate'),
    note: t('dashboards.widgets.quotation_status.win_rate_note'),
    value: summary.value.winRate,
  },
  {
    key: 'expired_rate',
    label: t('dashboards.widgets.quotation_status.expired_rate'),
    value: summary.value.expiredRate,
  },
]);

const RING_SIZE = 124;
// Inner radius 70% of the outer, as in the prototype
const RING_ARC_WIDTH = (RING_SIZE / 2) * 0.3;
const RING_PAD_ANGLE = (1.5 * Math.PI) / 180;
const SKELETON_ROWS = 5;
</script>

<template>
  <DashboardWidget :instance="instance">
    <div v-if="loading" class="flex flex-col" aria-busy="true">
      <div class="flex items-center gap-5">
        <Skeleton class="size-[124px] shrink-0 rounded-full" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton v-for="n in SKELETON_ROWS" :key="n" class="h-4 w-full" />
        </div>
      </div>
      <div class="mt-4 flex flex-col gap-3 border-t pt-3">
        <Skeleton v-for="n in 2" :key="n" class="h-7 w-full" />
      </div>
    </div>
    <!-- Less padding than the page-sized default: the widget body is small -->
    <Empty v-else-if="error" class="h-full gap-4 p-2 md:p-2">
      <EmptyHeader>
        <EmptyMedia variant="destructive">
          <LucideCircleAlert />
        </EmptyMedia>
        <EmptyTitle>
          {{ $t('error_fetching_entity', { entityKey: 'quotation' }, 2) }}
        </EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <ButtonIcon icon="retry" variant="secondary" @click="refresh()">
          {{ $t('retry') }}
        </ButtonIcon>
      </EmptyContent>
    </Empty>
    <Empty v-else-if="!summary.total" class="h-full gap-4 p-2 md:p-2">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideListChecks />
        </EmptyMedia>
        <EmptyTitle>
          {{ $t('no_entity', { entityKey: 'quotation' }, 2) }}
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
    <div v-else class="flex flex-col">
      <div class="flex items-center gap-5">
        <div class="relative size-[124px] shrink-0">
          <ChartContainer
            :config="chartConfig"
            class="aspect-auto"
            aria-hidden="true"
          >
            <VisSingleContainer
              :data="ringSlices"
              :height="RING_SIZE"
              :duration="0"
            >
              <VisDonut
                :value="sliceValue"
                :color="sliceFill"
                :arc-width="RING_ARC_WIDTH"
                :pad-angle="RING_PAD_ANGLE"
                :show-background="false"
              />
            </VisSingleContainer>
          </ChartContainer>
          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          >
            <span class="text-lg leading-none font-medium tabular-nums">
              {{ summary.total }}
            </span>
            <span class="text-muted-foreground mt-1 text-[11px]">
              {{
                $t('dashboards.widgets.quotation_status.total', summary.total)
              }}
            </span>
          </div>
        </div>
        <ul class="flex min-w-0 flex-1 flex-col gap-2">
          <li v-for="row in legend" :key="row.key">
            <!-- No link while the board is edited: a click would leave the page and drop the edit -->
            <component
              :is="editing ? 'div' : NuxtLink"
              v-bind="editing ? {} : { to: row.to }"
              class="group flex items-center gap-2 text-sm"
            >
              <span
                class="size-2.5 shrink-0 rounded-full"
                :style="{ backgroundColor: row.color }"
                aria-hidden="true"
              />
              <span
                :class="
                  cn('flex-1 truncate', !editing && 'group-hover:underline')
                "
              >
                {{ row.label }}
              </span>
              <span class="tabular-nums">{{ percent.format(row.share) }}</span>
            </component>
          </li>
        </ul>
      </div>
      <div class="mt-4 flex flex-col gap-3 border-t pt-3">
        <div v-for="rate in rates" :key="rate.key">
          <div class="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <div class="min-w-0">
              <p class="text-muted-foreground truncate">{{ rate.label }}</p>
              <p
                v-if="rate.note"
                class="text-muted-foreground truncate text-xs"
              >
                {{ rate.note }}
              </p>
            </div>
            <span class="shrink-0 tabular-nums">
              {{ formatRate(rate.value) }}
            </span>
          </div>
          <Progress
            :model-value="rate.value === null ? null : rate.value * 100"
            :aria-label="rate.label"
            class="bg-background h-1.5"
            indicator-class="bg-tone-success rounded-full"
          />
        </div>
      </div>
    </div>
  </DashboardWidget>
</template>
