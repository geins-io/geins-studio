<script setup lang="ts">
/**
 * What Demand and Revenue count, for Company sales' info panel: the two
 * measures, an example of one order in both, and the numbers' definitions.
 * From the definitions in Merchant Center's statistics, as in the prototype.
 */
const { t } = useI18n();

const MEASURES = [
  { key: 'demand', points: ['placed', 'cancelled', 'use'] },
  { key: 'revenue', points: ['delivered', 'only_delivered', 'use'] },
] as const;

const definitions = computed(() => [
  {
    term: t('dashboards.sales.order_value'),
    meaning: t('dashboards.sales.info.order_value'),
  },
  {
    term: t('dashboards.sales.revenue'),
    meaning: t('dashboards.sales.info.revenue_value'),
  },
  {
    term: t('dashboards.sales.info.refunds'),
    meaning: t('dashboards.sales.info.refunds_value'),
  },
]);
</script>

<template>
  <div class="flex flex-col gap-6 text-sm">
    <section
      v-for="measure in MEASURES"
      :key="measure.key"
      class="flex flex-col gap-2"
    >
      <h3 class="text-foreground text-base font-medium">
        {{ t(`dashboards.sales.${measure.key}`) }}
      </h3>
      <p>{{ t(`dashboards.sales.info.${measure.key}.lead`) }}</p>
      <ul class="flex flex-col gap-1.5">
        <li v-for="point in measure.points" :key="point" class="flex gap-2">
          <span
            class="bg-muted-foreground mt-2 size-1 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span>{{ t(`dashboards.sales.info.${measure.key}.${point}`) }}</span>
        </li>
      </ul>
    </section>
    <Feedback type="info">
      <template #description>
        {{ t('dashboards.sales.info.example') }}
      </template>
    </Feedback>
    <section class="flex flex-col gap-2">
      <h3 class="text-foreground text-base font-medium">
        {{ t('dashboards.sales.info.numbers') }}
      </h3>
      <dl class="flex flex-col">
        <div
          v-for="definition in definitions"
          :key="definition.term"
          class="flex gap-4 border-b py-2.5"
        >
          <dt class="text-foreground w-28 shrink-0 font-medium">
            {{ definition.term }}
          </dt>
          <dd>{{ definition.meaning }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
