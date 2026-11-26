// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type {
  ChannelListItem,
  ChannelMarket,
  DashboardPeriodPreset,
} from '#shared/types';
import {
  DASHBOARD_PERIOD_PRESETS,
  dashboardCurrency,
  dashboardMarketsFor,
  presetRange,
  pruneDashboardMarkets,
} from '../dashboard';

// Local dates: the presets work in the browser's time zone
const day = (year: number, month: number, date: number) =>
  new Date(year, month - 1, date);
const endOf = (date: Date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

describe('presetRange', () => {
  // Wednesday 25 November 2026, mid-afternoon
  const now = new Date(2026, 10, 25, 14, 30);

  it.each<[DashboardPeriodPreset, Date, Date]>([
    ['today', day(2026, 11, 25), day(2026, 11, 25)],
    ['yesterday', day(2026, 11, 24), day(2026, 11, 24)],
    ['this_week', day(2026, 11, 23), day(2026, 11, 25)],
    ['last_7_days', day(2026, 11, 19), day(2026, 11, 25)],
    ['this_month', day(2026, 11, 1), day(2026, 11, 25)],
    ['last_30_days', day(2026, 10, 27), day(2026, 11, 25)],
    ['ytd', day(2026, 1, 1), day(2026, 11, 25)],
  ])(
    '%s covers whole days from the start of one to the end of the other',
    (preset, from, to) => {
      expect(presetRange(preset, now)).toEqual({ from, to: endOf(to) });
    },
  );

  it('has a range for every preset in the bar', () => {
    for (const { key } of DASHBOARD_PERIOD_PRESETS) {
      const { from, to } = presetRange(key, now);
      expect(from.getTime()).toBeLessThan(to.getTime());
    }
  });

  it('starts the week on Monday, also on a Sunday and a Monday', () => {
    expect(presetRange('this_week', day(2026, 11, 29)).from).toEqual(
      day(2026, 11, 23),
    );
    expect(presetRange('this_week', day(2026, 11, 23)).from).toEqual(
      day(2026, 11, 23),
    );
  });

  it('takes yesterday across a month and a year', () => {
    expect(presetRange('yesterday', day(2026, 12, 1)).from).toEqual(
      day(2026, 11, 30),
    );
    expect(presetRange('yesterday', day(2027, 1, 1))).toEqual({
      from: day(2026, 12, 31),
      to: endOf(day(2026, 12, 31)),
    });
  });

  it('starts YTD on 1 January, even on 1 January', () => {
    expect(presetRange('ytd', day(2027, 1, 1))).toEqual({
      from: day(2027, 1, 1),
      to: endOf(day(2027, 1, 1)),
    });
  });
});

const market = (
  id: string,
  currency: string,
  extra: Partial<ChannelMarket> = {},
): ChannelMarket => ({
  _id: id,
  _type: 'market',
  country: { _id: id, _type: 'country', name: id, active: true },
  currency: {
    _id: currency,
    _type: 'currency',
    name: currency,
    symbol: { value: currency, prefixed: false },
    conversionRate: 1,
  },
  active: true,
  standardVatRate: 25,
  channelId: 1,
  virtual: false,
  attributes: [],
  allowedLanguages: [],
  defaultLanguage: 'en',
  ...extra,
});

const channel = (
  id: string,
  markets: ChannelMarket[],
  defaultMarket = markets[0]?._id ?? '',
): ChannelListItem => ({
  _id: id,
  _type: 'channel',
  name: id,
  url: '',
  active: true,
  identifier: id,
  channelType: 'webshop',
  markets,
  languages: [],
  languageCount: 0,
  marketCount: markets.length,
  defaultLanguage: 'en',
  defaultMarket,
  locked: false,
  activePaymentCount: 0,
  paymentCount: 0,
});

const se = market('se', 'SEK');
const no = market('no', 'NOK');
const de = market('de', 'EUR');
const CHANNELS = [
  channel('b2b', [se, no, market('virtual', 'SEK', { virtual: true })]),
  channel('web', [de, se], 'de'),
];

describe('dashboardMarketsFor', () => {
  it('offers every channel’s markets once when no channel is picked', () => {
    expect(dashboardMarketsFor(CHANNELS, []).map((m) => m._id)).toEqual([
      'se',
      'no',
      'de',
    ]);
  });

  it('follows the picked channels and leaves virtual markets out', () => {
    expect(dashboardMarketsFor(CHANNELS, ['web']).map((m) => m._id)).toEqual([
      'de',
      'se',
    ]);
  });
});

describe('pruneDashboardMarkets', () => {
  it('drops picked markets the new channels don’t have', () => {
    expect(pruneDashboardMarkets(CHANNELS, ['web'], ['no', 'se'])).toEqual([
      'se',
    ]);
  });

  it('keeps every market when the channels are cleared', () => {
    expect(pruneDashboardMarkets(CHANNELS, [], ['no', 'de'])).toEqual([
      'no',
      'de',
    ]);
  });
});

describe('dashboardCurrency', () => {
  it('is the picked market’s currency', () => {
    expect(dashboardCurrency(CHANNELS, [], ['no'])).toBe('NOK');
  });

  it('takes the first picked market in the filter’s order', () => {
    expect(dashboardCurrency(CHANNELS, [], ['de', 'no'])).toBe('NOK');
  });

  it('falls back to the first channel’s default market', () => {
    expect(dashboardCurrency(CHANNELS, [], [])).toBe('SEK');
  });

  it('falls back to the first picked channel’s default market', () => {
    expect(dashboardCurrency(CHANNELS, ['web'], [])).toBe('EUR');
  });

  it('ignores a picked market the channels in scope don’t have', () => {
    expect(dashboardCurrency(CHANNELS, ['web'], ['no'])).toBe('EUR');
  });

  it('is undefined without channels', () => {
    expect(dashboardCurrency([], [], [])).toBeUndefined();
  });
});
