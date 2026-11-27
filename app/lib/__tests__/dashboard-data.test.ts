// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { QuotationStatus } from '#shared/types';
import {
  DASHBOARD_ATTENTION,
  DASHBOARD_ATTENTION_KEYS,
  QUOTATION_STATUS_SLICES,
  attentionTileKey,
  calendarDaysUntil,
  companyInitials,
  expiringQuotations,
  failedExecutions,
  quotationRequests,
  quotationStatusSummary,
  recentQuotations,
} from '../dashboard-data';

// Local noon, so the local day is the same in every time zone the tests run in
const NOW = new Date(2026, 10, 25, 12, 0, 0);
const day = (offset: number, hour = 12) =>
  new Date(2026, 10, 25 + offset, hour, 0, 0).toISOString();

describe('quotationRequests', () => {
  it('keeps only requested quotations, newest request first', () => {
    const quotations = [
      { _id: 'a', status: 'requested' as QuotationStatus, createdAt: day(-3) },
      { _id: 'b', status: 'pending' as QuotationStatus, createdAt: day(-1) },
      {
        _id: 'c',
        status: 'requested' as QuotationStatus,
        createdAt: day(-5),
        request: { releasedAt: day(-1) },
      },
      { _id: 'd', status: 'draft' as QuotationStatus, createdAt: day(0) },
    ];
    expect(quotationRequests(quotations).map((q) => q._id)).toEqual(['c', 'a']);
  });

  it('counts none when there are no requests', () => {
    expect(
      quotationRequests([{ status: 'accepted' as QuotationStatus }]),
    ).toEqual([]);
  });
});

describe('calendarDaysUntil', () => {
  it('counts calendar days, not 24-hour spans', () => {
    expect(calendarDaysUntil(day(0, 23), NOW)).toBe(0);
    expect(calendarDaysUntil(day(1, 1), NOW)).toBe(1);
    expect(calendarDaysUntil(day(-1, 23), NOW)).toBe(-1);
  });

  it('reads a UTC-midnight value as the calendar day it names', () => {
    expect(calendarDaysUntil('2026-11-28T00:00:00Z', NOW)).toBe(3);
  });

  it('gives undefined for a missing or bad date', () => {
    expect(calendarDaysUntil(undefined, NOW)).toBeUndefined();
    expect(calendarDaysUntil(null, NOW)).toBeUndefined();
    expect(calendarDaysUntil('not a date', NOW)).toBeUndefined();
  });
});

describe('expiringQuotations', () => {
  const pending = (id: string, validTo?: string | null) => ({
    _id: id,
    status: 'pending' as QuotationStatus,
    validTo,
  });

  it('keeps pending quotations expiring today up to 7 days ahead, soonest first', () => {
    const result = expiringQuotations(
      [
        pending('in-7', day(7)),
        pending('today', day(0)),
        pending('in-3', day(3)),
      ],
      NOW,
    );
    expect(result.map((q) => q._id)).toEqual(['today', 'in-3', 'in-7']);
  });

  it('leaves out day 8, passed days and missing validTo', () => {
    const result = expiringQuotations(
      [
        pending('in-8', day(8)),
        pending('yesterday', day(-1)),
        pending('none', null),
        pending('undefined'),
      ],
      NOW,
    );
    expect(result).toEqual([]);
  });

  it('leaves out quotations that aren’t pending', () => {
    const result = expiringQuotations(
      [
        { _id: 'draft', status: 'draft' as QuotationStatus, validTo: day(2) },
        {
          _id: 'accepted',
          status: 'accepted' as QuotationStatus,
          validTo: day(2),
        },
      ],
      NOW,
    );
    expect(result).toEqual([]);
  });
});

describe('failedExecutions', () => {
  const hoursAgo = (hours: number) =>
    new Date(NOW.getTime() - hours * 3_600_000).toISOString();

  it('keeps failed runs started in the last 24 hours, newest first', () => {
    const result = failedExecutions(
      [
        { id: 'old', status: 'Failed', startTime: hoursAgo(25) },
        { id: 'edge', status: 'Failed', startTime: hoursAgo(24) },
        { id: 'new', status: 'failed', startTime: hoursAgo(1) },
        { id: 'ok', status: 'Completed', startTime: hoursAgo(2) },
        { id: 'mid', status: 'Failed', startTime: hoursAgo(5) },
      ],
      NOW,
    );
    expect(result.map((e) => e.id)).toEqual(['new', 'mid', 'edge']);
  });

  it('leaves out runs without a start time', () => {
    expect(
      failedExecutions([{ id: 'x', status: 'Failed', startTime: '' }], NOW),
    ).toEqual([]);
  });
});

describe('attention definitions', () => {
  it('defines every number Needs attention shows', () => {
    for (const key of DASHBOARD_ATTENTION_KEYS) {
      expect(DASHBOARD_ATTENTION[key].key).toBe(key);
    }
  });

  it('links to the filtered lists', () => {
    expect(DASHBOARD_ATTENTION.requests.to).toEqual({
      path: '/orders/quotations',
      query: { status: 'requested' },
    });
    expect(DASHBOARD_ATTENTION.expiring.to).toEqual({
      path: '/orders/quotations',
      query: { status: 'pending', expiring: '7d' },
    });
    expect(DASHBOARD_ATTENTION.failed_runs.to).toEqual({
      path: '/orchestrator/executions',
      query: { status: 'failed', period: '24h' },
    });
  });

  it('maps each single-number widget to its number', () => {
    expect(attentionTileKey('attention-quotation-requests')).toBe('requests');
    expect(attentionTileKey('attention-expiring-quotations')).toBe('expiring');
    expect(attentionTileKey('attention-failed-runs')).toBe('failed_runs');
    expect(attentionTileKey('needs-attention')).toBeUndefined();
  });
});

describe('recentQuotations', () => {
  it('sorts by last change, newest first, falling back to creation', () => {
    const result = recentQuotations([
      { _id: 'a', createdAt: day(-5), modifiedAt: day(-1) },
      { _id: 'b', createdAt: day(-2) },
      { _id: 'c', createdAt: day(-9), modifiedAt: day(0) },
    ]);
    expect(result.map((q) => q._id)).toEqual(['c', 'a', 'b']);
  });

  it('keeps the newest `limit`', () => {
    const quotations = Array.from({ length: 15 }, (_, i) => ({
      _id: String(i),
      createdAt: day(-i),
    }));
    expect(recentQuotations(quotations).map((q) => q._id)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
    expect(recentQuotations(quotations, 3)).toHaveLength(3);
  });

  it('leaves the input as it was', () => {
    const quotations = [
      { _id: 'old', createdAt: day(-2) },
      { _id: 'new', createdAt: day(0) },
    ];
    recentQuotations(quotations);
    expect(quotations[0]!._id).toBe('old');
  });
});

describe('quotationStatusSummary', () => {
  const quotations = (...statuses: QuotationStatus[]) =>
    statuses.map((status) => ({ status }));
  const counts = (statuses: QuotationStatus[]) =>
    Object.fromEntries(
      quotationStatusSummary(quotations(...statuses)).slices.map((s) => [
        s.key,
        s.count,
      ]),
    );

  it('counts accepted, confirmed and finalized as accepted', () => {
    expect(
      counts(['accepted', 'confirmed', 'finalized', 'pending', 'requested']),
    ).toEqual({
      requested: 1,
      pending: 1,
      accepted: 3,
      expired: 0,
      rejected: 0,
    });
  });

  it('leaves out quotations not sent yet and statuses no slice counts', () => {
    const summary = quotationStatusSummary(
      quotations('draft', 'requestDraft', 'revised', 'pending', 'expired'),
    );
    expect(summary.total).toBe(2);
    expect(summary.slices.map((s) => s.count)).toEqual([0, 1, 0, 1, 0]);
  });

  it('links each slice to the statuses it counts', () => {
    expect(
      Object.fromEntries(
        QUOTATION_STATUS_SLICES.map((s) => [s.key, s.statuses]),
      ),
    ).toEqual({
      requested: ['requested'],
      pending: ['pending'],
      accepted: ['accepted', 'confirmed', 'finalized'],
      expired: ['expired'],
      rejected: ['rejected'],
      canceled: ['canceled'],
    });
  });

  it("leaves out a status it doesn't know", () => {
    // As the API sends it: untyped JSON
    const payload = JSON.parse(
      '[{ "status": "archived" }, { "status": "constructor" }]',
    );
    expect(quotationStatusSummary(payload).total).toBe(0);
  });

  it('shows canceled only when there are any', () => {
    const keys = (statuses: QuotationStatus[]) =>
      quotationStatusSummary(quotations(...statuses)).slices.map((s) => s.key);
    expect(keys(['pending'])).toEqual([
      'requested',
      'pending',
      'accepted',
      'expired',
      'rejected',
    ]);
    expect(keys(['pending', 'canceled'])).toEqual([
      'requested',
      'pending',
      'accepted',
      'expired',
      'rejected',
      'canceled',
    ]);
  });

  it('gives each slice its share of every sent quotation', () => {
    const { slices } = quotationStatusSummary(
      quotations('pending', 'pending', 'pending', 'accepted'),
    );
    const share = (key: string) => slices.find((s) => s.key === key)?.share;
    expect(share('pending')).toBe(0.75);
    expect(share('accepted')).toBe(0.25);
    expect(share('rejected')).toBe(0);
  });

  it('works out the win rate from answered quotations only', () => {
    const { winRate } = quotationStatusSummary(
      quotations('accepted', 'finalized', 'confirmed', 'rejected', 'pending'),
    );
    expect(winRate).toBe(0.75);
  });

  it('works out expired without answer of every sent quotation', () => {
    const { expiredRate } = quotationStatusSummary(
      quotations('expired', 'requested', 'pending', 'accepted', 'draft'),
    );
    expect(expiredRate).toBe(0.25);
  });

  it('has no rate when there is nothing to divide by', () => {
    expect(quotationStatusSummary([])).toMatchObject({
      total: 0,
      winRate: null,
      expiredRate: null,
    });
    expect(
      quotationStatusSummary(quotations('pending', 'expired')).winRate,
    ).toBeNull();
    expect(quotationStatusSummary(quotations('draft')).expiredRate).toBeNull();
    expect(quotationStatusSummary([]).slices.every((s) => s.share === 0)).toBe(
      true,
    );
  });
});

describe('companyInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(companyInitials('Nordic Retail AB')).toBe('NR');
    expect(companyInitials('kontorsproffs')).toBe('K');
    expect(companyInitials('Bygg & Bo')).toBe('BB');
    expect(companyInitials('Åhléns  Varuhus')).toBe('ÅV');
  });

  it('falls back to ? when there are no letters', () => {
    expect(companyInitials('')).toBe('?');
    expect(companyInitials('123 456')).toBe('?');
  });
});
