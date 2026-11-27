// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { DashboardPeriod, DashboardPeriodPreset } from '#shared/types';
import { presetRange } from '../dashboard';
import {
  SALES_CHANNEL_COLORS,
  bucketSales,
  filterSalesOrders,
  salesChannelColor,
  salesChannelIds,
  previousSalesRange,
  salesBuckets,
  salesChange,
  salesGranularity,
  salesRange,
  salesSplit,
  salesTotals,
  type SalesOrder,
} from '../dashboard-sales';

// Wednesday 25 Nov 2026, 14:30 local time
const NOW = new Date(2026, 10, 25, 14, 30, 0);

const preset = (key: DashboardPeriodPreset, now = NOW): DashboardPeriod => ({
  preset: key,
  ...presetRange(key, now),
});
const custom = (from: Date, to: Date): DashboardPeriod => ({
  preset: 'custom',
  from,
  to,
});

const order = (
  dateCreated: Date,
  overrides: Partial<SalesOrder> = {},
): SalesOrder => ({
  dateCreated: dateCreated.toISOString(),
  sumExVat: 100,
  channel: '1',
  currency: 'SEK',
  wholesaleAccountId: 'company-a',
  ...overrides,
});

describe('salesGranularity', () => {
  it('is per hour for today and yesterday, per month for YTD, per day otherwise', () => {
    expect(salesGranularity(preset('today'))).toBe('hour');
    expect(salesGranularity(preset('yesterday'))).toBe('hour');
    expect(salesGranularity(preset('this_week'))).toBe('day');
    expect(salesGranularity(preset('last_7_days'))).toBe('day');
    expect(salesGranularity(preset('this_month'))).toBe('day');
    expect(salesGranularity(preset('last_30_days'))).toBe('day');
    expect(salesGranularity(preset('ytd'))).toBe('month');
  });

  it('splits custom periods by their length', () => {
    const day = (d: number) => new Date(2026, 0, d);
    expect(salesGranularity(custom(day(5), day(5)))).toBe('hour');
    expect(salesGranularity(custom(day(1), day(2)))).toBe('day');
    // 92 days: 1 Jan to 2 Apr
    expect(salesGranularity(custom(day(1), day(92)))).toBe('day');
    expect(salesGranularity(custom(day(1), day(93)))).toBe('month');
  });
});

describe('salesBuckets', () => {
  it('gives today one bucket per hour up to the current hour', () => {
    const buckets = salesBuckets(salesRange(preset('today'), NOW), 'hour');
    expect(buckets).toHaveLength(15);
    expect(buckets[0]!.start).toEqual(new Date(2026, 10, 25, 0));
    expect(buckets[14]!.start).toEqual(new Date(2026, 10, 25, 14));
    expect(buckets[14]!.end).toEqual(new Date(2026, 10, 25, 15));
  });

  it('gives yesterday all 24 hours', () => {
    const buckets = salesBuckets(salesRange(preset('yesterday'), NOW), 'hour');
    expect(buckets).toHaveLength(24);
    expect(buckets[0]!.start).toEqual(new Date(2026, 10, 24, 0));
    expect(buckets[23]!.end).toEqual(new Date(2026, 10, 25, 0));
  });

  it('gives one bucket per day, today included', () => {
    expect(
      salesBuckets(salesRange(preset('last_7_days'), NOW), 'day'),
    ).toHaveLength(7);
    // Monday 23 Nov to Wednesday 25 Nov
    const week = salesBuckets(salesRange(preset('this_week'), NOW), 'day');
    expect(week.map((b) => b.start.getDate())).toEqual([23, 24, 25]);
    expect(
      salesBuckets(salesRange(preset('this_month'), NOW), 'day'),
    ).toHaveLength(25);
  });

  it('gives YTD one bucket per month, January to this month', () => {
    const buckets = salesBuckets(salesRange(preset('ytd'), NOW), 'month');
    expect(buckets).toHaveLength(11);
    expect(buckets[0]!.start).toEqual(new Date(2026, 0, 1));
    expect(buckets[10]!.start).toEqual(new Date(2026, 10, 1));
    expect(buckets[10]!.end).toEqual(new Date(2026, 11, 1));
  });

  it('keeps a custom period whole when it lies in the past', () => {
    const period = custom(new Date(2026, 9, 1), new Date(2026, 9, 10, 23, 59));
    expect(salesBuckets(salesRange(period, NOW), 'day')).toHaveLength(10);
  });

  it('covers whole months for a long custom period starting mid-month', () => {
    const period = custom(
      new Date(2026, 0, 15),
      new Date(2026, 5, 10, 23, 59, 59, 999),
    );
    const buckets = salesBuckets(salesRange(period, NOW), 'month');
    expect(buckets.map((b) => b.start.getMonth())).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('bucketSales', () => {
  it('sums orders and value per bucket, empty buckets zero', () => {
    const buckets = salesBuckets(salesRange(preset('today'), NOW), 'hour');
    const points = bucketSales(
      [
        order(new Date(2026, 10, 25, 9, 0)),
        order(new Date(2026, 10, 25, 9, 59, 59), { sumExVat: 50 }),
        order(new Date(2026, 10, 25, 10, 0)),
        // Before and after the buckets: left out
        order(new Date(2026, 10, 24, 23, 59)),
        order(new Date(2026, 10, 25, 15, 0)),
      ],
      buckets,
    );
    expect(points).toHaveLength(15);
    expect(points[9]).toMatchObject({ orders: 2, value: 150 });
    expect(points[10]).toMatchObject({ orders: 1, value: 100 });
    expect(points[8]).toMatchObject({ orders: 0, value: 0 });
    expect(points.reduce((n, p) => n + p.orders, 0)).toBe(3);
  });

  it('puts an order at midnight in the day it starts', () => {
    const buckets = salesBuckets(salesRange(preset('this_week'), NOW), 'day');
    const points = bucketSales([order(new Date(2026, 10, 24, 0, 0))], buckets);
    expect(points.map((p) => p.orders)).toEqual([0, 1, 0]);
  });

  it('buckets per month', () => {
    const buckets = salesBuckets(salesRange(preset('ytd'), NOW), 'month');
    const points = bucketSales(
      [
        order(new Date(2026, 0, 31, 23, 59)),
        order(new Date(2026, 1, 1, 0, 0)),
        order(new Date(2026, 10, 25, 8, 0), { sumExVat: 1000 }),
      ],
      buckets,
    );
    expect(points.map((p) => p.orders)).toEqual([
      1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ]);
    expect(points[10]!.value).toBe(1000);
  });
});

describe('filterSalesOrders', () => {
  const range = salesRange(preset('today'), NOW);
  const orders = [
    order(new Date(2026, 10, 25, 8), { channel: '1', currency: 'SEK' }),
    order(new Date(2026, 10, 25, 9), { channel: '2', currency: 'SEK' }),
    order(new Date(2026, 10, 25, 10), { channel: '1', currency: 'EUR' }),
    order(new Date(2026, 10, 24, 10), { channel: '1', currency: 'SEK' }),
  ];

  it('keeps orders in the period and the currency, from every channel', () => {
    const kept = filterSalesOrders(orders, {
      ...range,
      channelIds: [],
      currency: 'SEK',
    });
    expect(kept).toEqual([orders[0], orders[1]]);
  });

  it('keeps only the picked channels', () => {
    const kept = filterSalesOrders(orders, {
      ...range,
      channelIds: ['2'],
      currency: 'SEK',
    });
    expect(kept).toEqual([orders[1]]);
  });

  it('matches the currency whatever its case', () => {
    const kept = filterSalesOrders(orders, {
      ...range,
      channelIds: [],
      currency: 'eur',
    });
    expect(kept).toEqual([orders[2]]);
  });

  it('includes both ends of the range', () => {
    const edges = [
      order(range.from),
      order(range.to),
      order(new Date(range.to.getTime() + 1)),
    ];
    const kept = filterSalesOrders(edges, {
      ...range,
      channelIds: [],
      currency: 'SEK',
    });
    expect(kept).toHaveLength(2);
  });
});

describe('salesTotals', () => {
  it('counts orders, value, average and distinct companies', () => {
    const totals = salesTotals([
      order(NOW, { sumExVat: 100, wholesaleAccountId: 'a' }),
      order(NOW, { sumExVat: 300, wholesaleAccountId: 'a' }),
      order(NOW, { sumExVat: 200, wholesaleAccountId: 'b' }),
    ]);
    expect(totals).toEqual({
      orders: 3,
      value: 600,
      average: 200,
      companies: 2,
    });
  });

  it('is all zero without orders', () => {
    expect(salesTotals([])).toEqual({
      orders: 0,
      value: 0,
      average: 0,
      companies: 0,
    });
  });
});

describe('previousSalesRange', () => {
  it('compares today with yesterday at this time', () => {
    expect(previousSalesRange(preset('today'), NOW)).toEqual({
      from: new Date(2026, 10, 24, 0, 0),
      to: new Date(2026, 10, 24, 14, 30),
      comparison: 'yesterday_at_this_time',
    });
  });

  it('compares yesterday with the whole day before', () => {
    expect(previousSalesRange(preset('yesterday'), NOW)).toEqual({
      from: new Date(2026, 10, 23, 0, 0),
      to: new Date(2026, 10, 23, 23, 59, 59, 999),
      comparison: 'day_before',
    });
  });

  it('compares this week with last week at this time', () => {
    expect(previousSalesRange(preset('this_week'), NOW)).toEqual({
      from: new Date(2026, 10, 16, 0, 0),
      to: new Date(2026, 10, 18, 14, 30),
      comparison: 'last_week_at_this_time',
    });
  });

  it('compares this month with last month at this time', () => {
    expect(previousSalesRange(preset('this_month'), NOW)).toEqual({
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 25, 14, 30),
      comparison: 'last_month_at_this_time',
    });
  });

  it('stops at the end of a shorter month', () => {
    const now = new Date(2026, 2, 31, 9, 0);
    expect(previousSalesRange(preset('this_month', now), now).to).toEqual(
      new Date(2026, 1, 28, 9, 0),
    );
  });

  it('compares YTD with last year at this time', () => {
    expect(previousSalesRange(preset('ytd'), NOW)).toEqual({
      from: new Date(2025, 0, 1),
      to: new Date(2025, 10, 25, 14, 30),
      comparison: 'last_year_at_this_time',
    });
    // 29 Feb has no day last year: 28 Feb
    const leap = new Date(2028, 1, 29, 10, 0);
    expect(previousSalesRange(preset('ytd', leap), leap).to).toEqual(
      new Date(2027, 1, 28, 10, 0),
    );
  });

  it('compares rolling periods with the same length before, up to the same point', () => {
    // Today is under way: the days before are cut at this time too
    expect(previousSalesRange(preset('last_7_days'), NOW)).toEqual({
      from: new Date(2026, 10, 12),
      to: new Date(2026, 10, 18, 14, 30),
      comparison: 'previous_7_days',
    });
    expect(previousSalesRange(preset('last_30_days'), NOW)).toMatchObject({
      from: new Date(2026, 8, 27),
      to: new Date(2026, 9, 26, 14, 30),
      comparison: 'previous_30_days',
    });
    const running = custom(
      new Date(2026, 10, 24),
      new Date(2026, 10, 25, 23, 59, 59, 999),
    );
    expect(previousSalesRange(running, NOW)).toMatchObject({
      from: new Date(2026, 10, 22),
      to: new Date(2026, 10, 23, 14, 30),
    });
  });

  it('compares a finished custom period with the whole days before', () => {
    const period = custom(
      new Date(2026, 9, 10),
      new Date(2026, 9, 12, 23, 59, 59, 999),
    );
    expect(previousSalesRange(period, NOW)).toEqual({
      from: new Date(2026, 9, 7),
      to: new Date(2026, 9, 9, 23, 59, 59, 999),
      comparison: 'previous_period',
    });
  });

  it('picks the orders to compare with', () => {
    const previous = previousSalesRange(preset('today'), NOW);
    const orders = [
      order(new Date(2026, 10, 24, 9)),
      order(new Date(2026, 10, 24, 14, 30)),
      // Later yesterday than now is today: not yet comparable
      order(new Date(2026, 10, 24, 16)),
    ];
    const kept = filterSalesOrders(orders, {
      ...previous,
      channelIds: [],
      currency: 'SEK',
    });
    expect(salesTotals(kept).orders).toBe(2);
  });
});

describe('salesChange', () => {
  it('is the change as a fraction of the previous value', () => {
    expect(salesChange(120, 100)).toBeCloseTo(0.2);
    expect(salesChange(75, 100)).toBeCloseTo(-0.25);
    expect(salesChange(0, 100)).toBe(-1);
    expect(salesChange(100, 100)).toBe(0);
  });

  it('is null without a previous value', () => {
    expect(salesChange(5, 0)).toBeNull();
    expect(salesChange(0, 0)).toBeNull();
  });
});

describe('splitting by channel', () => {
  const buckets = salesBuckets(salesRange(preset('this_week'), NOW), 'day');
  const orders = [
    order(new Date(2026, 10, 23, 9), { channel: '1', sumExVat: 100 }),
    order(new Date(2026, 10, 23, 10), { channel: '2', sumExVat: 50 }),
    order(new Date(2026, 10, 23, 11), { channel: '1', sumExVat: 25 }),
    order(new Date(2026, 10, 25, 8), { channel: '2', sumExVat: 70 }),
  ];

  it('sums each step per channel, adding up to the total', () => {
    const points = bucketSales(orders, buckets);
    expect(points[0]!.channels).toEqual({ '1': 125, '2': 50 });
    expect(points[1]!.channels).toEqual({});
    expect(points[2]!.channels).toEqual({ '2': 70 });
    for (const point of points) {
      const parts = Object.values(point.channels).reduce((n, v) => n + v, 0);
      expect(parts).toBe(point.value);
    }
  });

  it('keeps the channels in scope, with or without orders, in their order', () => {
    expect(salesChannelIds(orders, ['3', '2', '1'])).toEqual(['3', '2', '1']);
  });

  it('adds channels an order is in that the scope does not list', () => {
    // All channels picked: an order in a channel the account no longer has
    const withGone = [...orders, order(NOW, { channel: '9' })];
    expect(salesChannelIds(withGone, ['1', '2'])).toEqual(['1', '2', '9']);
  });

  it('splits only the picked channels once the orders are filtered', () => {
    const picked = filterSalesOrders(orders, {
      ...salesRange(preset('this_week'), NOW),
      channelIds: ['2'],
      currency: 'SEK',
    });
    const points = bucketSales(picked, buckets);
    expect(salesChannelIds(picked, ['2'])).toEqual(['2']);
    expect(points.map((p) => p.channels['2'] ?? 0)).toEqual([50, 0, 70]);
    expect(points.every((p) => !('1' in p.channels))).toBe(true);
  });

  it('cycles the channel colours', () => {
    expect(salesChannelColor(0)).toBe('var(--tone-success)');
    expect(salesChannelColor(SALES_CHANNEL_COLORS.length)).toBe(
      salesChannelColor(0),
    );
    expect(new Set(SALES_CHANNEL_COLORS.slice(0, 5)).size).toBe(5);
  });

  it('reads the saved split, total by default', () => {
    expect(salesSplit()).toBe('total');
    expect(salesSplit({ split: 'channel' })).toBe('channel');
    expect(salesSplit({ split: 'market' })).toBe('total');
  });
});
