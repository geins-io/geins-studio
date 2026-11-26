// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  LIST_URL_PERIOD_MS,
  executionListLink,
  expiresWithin,
  matchesExecutionStatus,
  matchesQuotationListFilters,
  parseExecutionListQuery,
  parseListUrlPeriod,
  parseQuotationListQuery,
  quotationListLink,
} from '../list-url-filters';

const NOW = Date.parse('2026-11-25T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

describe('parseQuotationListQuery', () => {
  it('reads one status', () => {
    expect(parseQuotationListQuery({ status: 'requested' })).toEqual({
      statuses: ['requested'],
      expiring: null,
    });
  });

  it('reads several statuses, comma-separated or repeated', () => {
    expect(
      parseQuotationListQuery({ status: 'pending,accepted' }).statuses,
    ).toEqual(['pending', 'accepted']);
    expect(
      parseQuotationListQuery({ status: ['pending', 'accepted'] }).statuses,
    ).toEqual(['pending', 'accepted']);
  });

  it('drops unknown and duplicate statuses', () => {
    expect(
      parseQuotationListQuery({ status: 'pending,bogus,pending,Pending' })
        .statuses,
    ).toEqual(['pending']);
    expect(parseQuotationListQuery({ status: 'bogus' }).statuses).toEqual([]);
  });

  it('reads the expiring window and ignores unknown ones', () => {
    expect(
      parseQuotationListQuery({ status: 'pending', expiring: '7d' }),
    ).toEqual({ statuses: ['pending'], expiring: '7d' });
    expect(parseQuotationListQuery({ expiring: '8d' }).expiring).toBeNull();
  });

  it('returns no filters for an empty or odd query', () => {
    const none = { statuses: [], expiring: null };
    expect(parseQuotationListQuery({})).toEqual(none);
    expect(parseQuotationListQuery({ status: null, expiring: 7 })).toEqual(
      none,
    );
  });
});

describe('parseListUrlPeriod', () => {
  it('accepts the known periods only', () => {
    expect(parseListUrlPeriod('24h')).toBe('24h');
    expect(parseListUrlPeriod('2h')).toBeNull();
    expect(parseListUrlPeriod(undefined)).toBeNull();
  });

  it('ignores inherited object keys', () => {
    expect(parseListUrlPeriod('toString')).toBeNull();
    expect(parseListUrlPeriod('constructor')).toBeNull();
  });
});

describe('expiresWithin', () => {
  const window = LIST_URL_PERIOD_MS['7d'];

  it('includes both ends of the window', () => {
    expect(expiresWithin(iso(NOW), '7d', NOW)).toBe(true);
    expect(expiresWithin(iso(NOW + window), '7d', NOW)).toBe(true);
    expect(expiresWithin(iso(NOW + 3 * DAY), '7d', NOW)).toBe(true);
  });

  it('excludes dates past the window or already passed', () => {
    expect(expiresWithin(iso(NOW + window + 1), '7d', NOW)).toBe(false);
    expect(expiresWithin(iso(NOW - 1), '7d', NOW)).toBe(false);
  });

  it('is false without a valid date', () => {
    expect(expiresWithin(undefined, '7d', NOW)).toBe(false);
    expect(expiresWithin(null, '7d', NOW)).toBe(false);
    expect(expiresWithin('not a date', '7d', NOW)).toBe(false);
  });
});

describe('matchesQuotationListFilters', () => {
  const expiringSoon = iso(NOW + 2 * DAY);
  const expiringLater = iso(NOW + 20 * DAY);
  const filters = parseQuotationListQuery({
    status: 'pending',
    expiring: '7d',
  });

  it('keeps pending quotations expiring within the window', () => {
    expect(
      matchesQuotationListFilters(
        { status: 'pending', validTo: expiringSoon },
        filters,
        NOW,
      ),
    ).toBe(true);
  });

  it('drops other statuses, later dates and missing dates', () => {
    expect(
      matchesQuotationListFilters(
        { status: 'accepted', validTo: expiringSoon },
        filters,
        NOW,
      ),
    ).toBe(false);
    expect(
      matchesQuotationListFilters(
        { status: 'pending', validTo: expiringLater },
        filters,
        NOW,
      ),
    ).toBe(false);
    expect(
      matchesQuotationListFilters({ status: 'pending' }, filters, NOW),
    ).toBe(false);
  });

  it('keeps everything without filters', () => {
    expect(
      matchesQuotationListFilters(
        { status: 'draft' },
        { statuses: [], expiring: null },
        NOW,
      ),
    ).toBe(true);
  });
});

describe('parseExecutionListQuery', () => {
  it('reads status and period, case-insensitively', () => {
    expect(
      parseExecutionListQuery({ status: 'failed', period: '24h' }),
    ).toEqual({ statuses: ['failed'], period: '24h' });
    expect(parseExecutionListQuery({ status: 'Failed,TimedOut' })).toEqual({
      statuses: ['failed', 'timedout'],
      period: null,
    });
  });

  it('drops unknown values', () => {
    expect(
      parseExecutionListQuery({ status: 'exploded', period: '2d' }),
    ).toEqual({ statuses: [], period: null });
  });
});

describe('matchesExecutionStatus', () => {
  it('compares case-insensitively', () => {
    expect(matchesExecutionStatus('Failed', ['failed'])).toBe(true);
    expect(matchesExecutionStatus('completed', ['failed'])).toBe(false);
    expect(matchesExecutionStatus(undefined, ['failed'])).toBe(false);
  });

  it('matches anything without statuses', () => {
    expect(matchesExecutionStatus('running', [])).toBe(true);
  });
});

describe('list links', () => {
  it('builds the dashboard links', () => {
    expect(quotationListLink({ statuses: ['requested'] })).toBe(
      '/orders/quotations?status=requested',
    );
    expect(quotationListLink({ statuses: ['pending'], expiring: '7d' })).toBe(
      '/orders/quotations?status=pending&expiring=7d',
    );
    expect(executionListLink({ statuses: ['failed'], period: '24h' })).toBe(
      '/orchestrator/executions?status=failed&period=24h',
    );
  });

  it('keeps commas between several statuses', () => {
    expect(quotationListLink({ statuses: ['pending', 'accepted'] })).toBe(
      '/orders/quotations?status=pending,accepted',
    );
  });

  it('leaves out empty filters', () => {
    expect(quotationListLink()).toBe('/orders/quotations');
    expect(executionListLink({ statuses: [] })).toBe(
      '/orchestrator/executions',
    );
  });

  it('round-trips through the parsers', () => {
    const query = Object.fromEntries(
      new URLSearchParams(
        quotationListLink({ statuses: ['pending', 'accepted'] }).split('?')[1],
      ),
    );
    expect(parseQuotationListQuery(query).statuses).toEqual([
      'pending',
      'accepted',
    ]);
  });
});
