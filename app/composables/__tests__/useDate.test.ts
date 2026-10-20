// @vitest-environment node
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useDate } from '../useDate';

mockNuxtImport('useCookieLocale', () => () => ref('en'));

const NOW = new Date('2026-10-01T12:00:00Z');
const at = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);
const DAY = 86_400;

describe('useDate', () => {
  describe('formatRelativeDate', () => {
    const { formatRelativeDate } = useDate();

    it('counts days up to a month, never weeks', () => {
      expect(formatRelativeDate(at(12 * DAY), NOW)).toBe('in 12 days');
      expect(formatRelativeDate(at(29.6 * DAY), NOW)).toBe('in 30 days');
    });

    it('uses larger units past a month', () => {
      expect(formatRelativeDate(at(65 * DAY), NOW)).toBe('in 2 months');
      expect(formatRelativeDate(at(-400 * DAY), NOW)).toBe('last year');
    });

    it('drops to hours and minutes inside a day', () => {
      expect(formatRelativeDate(at(-3 * 3_600), NOW)).toBe('3 hours ago');
      expect(formatRelativeDate(at(5 * 60), NOW)).toBe('in 5 minutes');
    });

    it('reads one day as tomorrow / yesterday', () => {
      expect(formatRelativeDate(at(DAY), NOW)).toBe('tomorrow');
      expect(formatRelativeDate(at(-DAY), NOW)).toBe('yesterday');
    });

    it('accepts ISO strings and handles empty or invalid input', () => {
      expect(formatRelativeDate(at(2 * DAY).toISOString(), NOW)).toBe(
        'in 2 days',
      );
      expect(formatRelativeDate(null)).toBe('');
      expect(formatRelativeDate('not a date')).toBe('not a date');
    });
  });
});
