// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';
import {
  calendarDay,
  calendarDayToLocalIso,
  localDay,
  toCalendarDayIso,
} from '../calendar-day';

const originalTz = process.env.TZ;
afterAll(() => {
  process.env.TZ = originalTz;
});

// Node re-reads TZ when it changes, so each block runs in its own zone.
const inZone = (tz: string, fn: () => void) => () => {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    fn();
  } finally {
    process.env.TZ = previous;
  }
};

describe.each(['Europe/Stockholm', 'America/New_York', 'UTC'])(
  'in %s',
  (tz) => {
    it(
      'sends the picked day at UTC midnight',
      inZone(tz, () => {
        // What FormInputDate emits for 20 Nov
        const picked = new Date('2026-11-20').toISOString();
        expect(toCalendarDayIso(picked)).toBe('2026-11-20T00:00:00Z');
      }),
    );

    it(
      'sends a local midnight as its own day',
      inZone(tz, () => {
        const localMidnight = new Date(2026, 10, 20).toISOString();
        expect(toCalendarDayIso(localMidnight)).toBe('2026-11-20T00:00:00Z');
      }),
    );

    it(
      'round-trips a stored day through the picker',
      inZone(tz, () => {
        const stored = '2026-11-20T00:00:00Z';
        const seeded = calendarDayToLocalIso(stored)!;
        // The picker formats in local time, so it must land on the same day
        expect(localDay(seeded)).toBe('2026-11-20');
        expect(toCalendarDayIso(seeded)).toBe(stored);
      }),
    );
  },
);

describe('calendarDay', () => {
  it(
    'reads a non-midnight instant as the local day (UTC+)',
    inZone('Europe/Stockholm', () => {
      // A buyer's 20 Nov sent with a +01:00 offset, stored as UTC
      expect(calendarDay('2026-11-19T23:00:00Z')).toBe('2026-11-20');
    }),
  );

  it(
    'reads a non-midnight instant as the local day (UTC−)',
    inZone('America/New_York', () => {
      expect(calendarDay('2026-11-20T05:00:00Z')).toBe('2026-11-20');
      expect(calendarDay('2026-11-20T03:00:00Z')).toBe('2026-11-19');
    }),
  );

  it('keeps the UTC date of a UTC midnight', () => {
    expect(calendarDay('2026-11-20T00:00:00.000Z')).toBe('2026-11-20');
  });

  it('is undefined for an invalid value', () => {
    expect(calendarDay('not a date')).toBeUndefined();
    expect(toCalendarDayIso('')).toBeUndefined();
    expect(calendarDayToLocalIso('nope')).toBeUndefined();
  });
});
