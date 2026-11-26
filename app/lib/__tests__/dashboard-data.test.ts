// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { QuotationStatus } from '#shared/types';
import {
  DASHBOARD_ATTENTION,
  DASHBOARD_ATTENTION_KEYS,
  attentionTileKey,
  calendarDaysUntil,
  expiringQuotations,
  failedExecutions,
  quotationRequests,
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
