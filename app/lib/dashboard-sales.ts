import type { DashboardPeriod, Order } from '#shared/types';
import { endOfDay, startOfDay } from './dashboard';

/**
 * Company sales (Demand) worked out in the browser from all wholesale orders:
 * the order query has no date filter or aggregation. Demand counts an order on
 * the day it was placed (`dateCreated`, local time), whatever its status.
 * Pure, so the widget and its tests share one definition.
 */

/** What a sales total is made of; the rest of an order isn't read */
export type SalesOrder = Pick<
  Order,
  'dateCreated' | 'sumExVat' | 'channel' | 'currency' | 'wholesaleAccountId'
>;

export type SalesGranularity = 'hour' | 'day' | 'month';
export type SalesChartKind = 'line' | 'bar';

/** The chart a Company sales widget draws, saved in its `config.kind`; line by default */
export function salesChartKind(
  config?: Record<string, unknown>,
): SalesChartKind {
  return config?.kind === 'bar' ? 'bar' : 'line';
}

export type SalesSplit = 'total' | 'channel';

/** Whether a Company sales widget splits by channel, saved in its `config.split` */
export function salesSplit(config?: Record<string, unknown>): SalesSplit {
  return config?.split === 'channel' ? 'channel' : 'total';
}

/**
 * Channel colours for a split chart, in order: status tones that stay apart
 * for five or so channels, then the rest of the palette. Theme tokens only.
 */
export const SALES_CHANNEL_COLORS = [
  'var(--tone-success)',
  'var(--tone-info)',
  'var(--tone-warning)',
  'var(--tone-purple)',
  'var(--tone-pink)',
  'var(--tone-indigo)',
  'var(--tone-teal)',
  'var(--tone-slate)',
];

export function salesChannelColor(index: number): string {
  return SALES_CHANNEL_COLORS[index % SALES_CHANNEL_COLORS.length]!;
}

/** A custom period longer than this many days is shown per month */
export const SALES_MONTHS_AFTER_DAYS = 92;

const DAY_MS = 24 * 60 * 60 * 1000;

function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

/**
 * `date` moved by whole months, on the same day and time, or the month's last
 * day when it's shorter (31 March → 28 or 29 February).
 */
function shiftMonths(date: Date, months: number): Date {
  const shifted = new Date(date);
  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() + months);
  const lastDay = new Date(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    0,
  ).getDate();
  shifted.setDate(Math.min(date.getDate(), lastDay));
  return shifted;
}

/** Calendar days from `from`'s day to `to`'s, both counted */
function daysIn(from: Date, to: Date): number {
  return (
    Math.round(
      (startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS,
    ) + 1
  );
}

/**
 * How finely a period is split: per hour for one day (Today, Yesterday, a
 * one-day custom period), per month for YTD and custom periods over
 * `SALES_MONTHS_AFTER_DAYS` days, per day otherwise.
 */
export function salesGranularity(period: DashboardPeriod): SalesGranularity {
  switch (period.preset) {
    case 'today':
    case 'yesterday':
      return 'hour';
    case 'ytd':
      return 'month';
    case 'custom': {
      const days = daysIn(period.from, period.to);
      if (days <= 1) return 'hour';
      return days > SALES_MONTHS_AFTER_DAYS ? 'month' : 'day';
    }
    default:
      return 'day';
  }
}

export interface SalesRange {
  from: Date;
  to: Date;
}

/** The part of the period that has happened by `now`: no buckets in the future */
export function salesRange(period: DashboardPeriod, now: Date): SalesRange {
  return {
    from: period.from,
    to: new Date(Math.min(period.to.getTime(), now.getTime())),
  };
}

/** One step on the chart, from `start` up to (not including) `end` */
export interface SalesBucket {
  start: Date;
  end: Date;
}

function bucketStart(date: Date, granularity: SalesGranularity): Date {
  if (granularity === 'month') {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  if (granularity === 'day') return startOfDay(date);
  const hour = new Date(date);
  hour.setMinutes(0, 0, 0);
  return hour;
}

function nextBucket(start: Date, granularity: SalesGranularity): Date {
  if (granularity === 'month') {
    return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  }
  if (granularity === 'day') return shiftDays(start, 1);
  const next = new Date(start);
  next.setHours(next.getHours() + 1);
  return next;
}

/**
 * The steps from `from` to `to` in local time, the first and last ones whole
 * (a period starting mid-month still gets that month's whole bucket).
 */
export function salesBuckets(
  range: SalesRange,
  granularity: SalesGranularity,
): SalesBucket[] {
  const buckets: SalesBucket[] = [];
  let start = bucketStart(range.from, granularity);
  while (start <= range.to) {
    const end = nextBucket(start, granularity);
    buckets.push({ start, end });
    start = end;
  }
  return buckets;
}

export interface SalesOrderFilter extends SalesRange {
  /** Picked channel ids; empty for all */
  channelIds: readonly string[];
  /** Only orders in this currency, since sums can't mix currencies */
  currency: string;
}

/**
 * Orders placed from `from` to `to` (inclusive) in the picked channels and the
 * dashboard currency. Orders have no market, so the market filter acts only
 * through the currency it picks.
 */
export function filterSalesOrders<T extends SalesOrder>(
  orders: readonly T[],
  { from, to, channelIds, currency }: SalesOrderFilter,
): T[] {
  const wanted = currency.toUpperCase();
  return orders.filter((order) => {
    const placed = new Date(order.dateCreated).getTime();
    return (
      placed >= from.getTime() &&
      placed <= to.getTime() &&
      (!channelIds.length || channelIds.includes(String(order.channel))) &&
      String(order.currency).toUpperCase() === wanted
    );
  });
}

/**
 * One step's Demand: the number of orders and their value ex. VAT, in total
 * and per channel id (the parts add up to `value`).
 */
export interface SalesPoint {
  start: Date;
  orders: number;
  value: number;
  channels: Record<string, number>;
}

/** Index of the bucket `time` falls in, or -1 outside them all */
function bucketIndex(buckets: SalesBucket[], time: number): number {
  let low = 0;
  let high = buckets.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const bucket = buckets[mid]!;
    if (time < bucket.start.getTime()) high = mid - 1;
    else if (time >= bucket.end.getTime()) low = mid + 1;
    else return mid;
  }
  return -1;
}

/** Orders summed per bucket; every bucket gets a point, empty ones zero */
export function bucketSales(
  orders: readonly SalesOrder[],
  buckets: SalesBucket[],
): SalesPoint[] {
  const points: SalesPoint[] = buckets.map((bucket) => ({
    start: bucket.start,
    orders: 0,
    value: 0,
    channels: {},
  }));
  for (const order of orders) {
    const index = bucketIndex(buckets, new Date(order.dateCreated).getTime());
    const point = points[index];
    if (!point) continue;
    const value = order.sumExVat || 0;
    const channel = String(order.channel);
    point.orders++;
    point.value += value;
    point.channels[channel] = (point.channels[channel] ?? 0) + value;
  }
  return points;
}

/**
 * The channels a split chart shows, in order: the channels in scope (even
 * without orders), then any other channel an order is in, e.g. one no longer
 * on the account, so the parts always add up to the total.
 */
export function salesChannelIds(
  orders: readonly SalesOrder[],
  scopeIds: readonly string[],
): string[] {
  const ids = [...scopeIds];
  const known = new Set(ids);
  for (const order of orders) {
    const id = String(order.channel);
    if (known.has(id)) continue;
    known.add(id);
    ids.push(id);
  }
  return ids;
}

/** The key numbers: orders, order value, average order value, companies ordering */
export interface SalesTotals {
  orders: number;
  value: number;
  average: number;
  companies: number;
}

export function salesTotals(orders: readonly SalesOrder[]): SalesTotals {
  const value = orders.reduce((sum, order) => sum + (order.sumExVat || 0), 0);
  const companies = new Set(
    orders.map((order) => order.wholesaleAccountId).filter(Boolean),
  ).size;
  return {
    orders: orders.length,
    value,
    average: orders.length ? value / orders.length : 0,
    companies,
  };
}

/**
 * What the key numbers are compared with. Periods that run to now compare with
 * the period before up to the same point ("at this time"); finished and rolling
 * periods with the same length right before them.
 */
export type SalesComparison =
  | 'yesterday_at_this_time'
  | 'day_before'
  | 'last_week_at_this_time'
  | 'last_month_at_this_time'
  | 'last_year_at_this_time'
  | 'previous_7_days'
  | 'previous_30_days'
  | 'previous_period';

export interface PreviousSalesRange extends SalesRange {
  comparison: SalesComparison;
}

/** The period the key numbers are compared with, seen from `now` */
export function previousSalesRange(
  period: DashboardPeriod,
  now: Date,
): PreviousSalesRange {
  // A period still running is compared up to the same point, so a morning
  // isn't held against a whole day
  const sameLengthBefore = (comparison: SalesComparison) => {
    const days = daysIn(period.from, period.to);
    const running = period.to.getTime() > now.getTime();
    return {
      from: shiftDays(startOfDay(period.from), -days),
      to: running
        ? shiftDays(now, -days)
        : endOfDay(shiftDays(period.from, -1)),
      comparison,
    };
  };
  switch (period.preset) {
    case 'today':
      return {
        from: shiftDays(startOfDay(now), -1),
        to: shiftDays(now, -1),
        comparison: 'yesterday_at_this_time',
      };
    case 'yesterday':
      return sameLengthBefore('day_before');
    case 'this_week':
      return {
        from: shiftDays(period.from, -7),
        to: shiftDays(now, -7),
        comparison: 'last_week_at_this_time',
      };
    case 'this_month':
      return {
        from: shiftMonths(period.from, -1),
        to: shiftMonths(now, -1),
        comparison: 'last_month_at_this_time',
      };
    case 'ytd':
      return {
        from: new Date(period.from.getFullYear() - 1, 0, 1),
        to: shiftMonths(now, -12),
        comparison: 'last_year_at_this_time',
      };
    case 'last_7_days':
      return sameLengthBefore('previous_7_days');
    case 'last_30_days':
      return sameLengthBefore('previous_30_days');
    default:
      return sameLengthBefore('previous_period');
  }
}

/**
 * The change from `previous` to `current` as a fraction (0.12 = +12%), or
 * `null` when there's nothing to compare with.
 */
export function salesChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}
