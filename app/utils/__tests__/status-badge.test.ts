// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { statusBadgeVariant } from '../status-badge';

describe('statusBadgeVariant', () => {
  it.each([
    ['completed', 'positive'],
    ['confirmed', 'positive'],
    ['accepted', 'success'],
    ['enabled', 'success'],
    ['healthy', 'success'],
    ['finalized', 'success-solid'],
    ['pending', 'info'],
    ['sent', 'info'],
    ['partial', 'info'],
    ['in-progress', 'info'],
    ['requested', 'info-solid'],
    ['expired', 'warning'],
    ['on-hold', 'warning'],
    ['backorder', 'warning'],
    ['degraded', 'warning'],
    ['canceled', 'danger'],
    ['rejected', 'danger'],
    ['unhealthy', 'danger'],
    ['inactive', 'neutral'],
    ['refunded', 'neutral'],
    ['revised', 'neutral'],
    ['idle', 'neutral'],
    ['draft', 'draft'],
  ] as const)('maps %s to %s', (status, variant) => {
    expect(statusBadgeVariant(status)).toBe(variant);
  });

  // Orders send the British spelling, quotations the American one.
  it('colors both spellings of canceled', () => {
    expect(statusBadgeVariant('cancelled')).toBe('danger');
    expect(statusBadgeVariant('canceled')).toBe('danger');
  });

  it('maps booleans to active and inactive', () => {
    expect(statusBadgeVariant(true)).toBe('positive');
    expect(statusBadgeVariant(false)).toBe('neutral');
  });

  it('renders unknown statuses neutral', () => {
    expect(statusBadgeVariant('scheduled')).toBe('neutral');
    expect(statusBadgeVariant('constructor')).toBe('neutral');
  });
});
