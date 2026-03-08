// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { usePrice } from '../usePrice';

describe('usePrice', () => {
  const { convertToPrice, formatCurrency } = usePrice();

  describe('convertToPrice', () => {
    it('converts string price', () => {
      expect(convertToPrice('19.99', 'USD')).toEqual({
        price: '19.99',
        currency: 'USD',
        placeholder: undefined,
      });
    });

    it('converts number price to string', () => {
      expect(convertToPrice(42, 'EUR')).toEqual({
        price: '42',
        currency: 'EUR',
        placeholder: undefined,
      });
    });

    it('returns undefined price for undefined input', () => {
      expect(convertToPrice(undefined, 'SEK')).toEqual({
        price: undefined,
        currency: 'SEK',
        placeholder: undefined,
      });
    });

    it('treats zero price as falsy (returns undefined)', () => {
      expect(convertToPrice(0, 'USD')).toEqual({
        price: undefined,
        currency: 'USD',
        placeholder: undefined,
      });
    });

    it('treats empty string price as falsy (returns undefined)', () => {
      expect(convertToPrice('', 'USD')).toEqual({
        price: undefined,
        currency: 'USD',
        placeholder: undefined,
      });
    });

    it('includes string placeholder', () => {
      expect(convertToPrice('10', 'USD', 'N/A')).toEqual({
        price: '10',
        currency: 'USD',
        placeholder: 'N/A',
      });
    });

    it('converts number placeholder to string', () => {
      expect(convertToPrice('10', 'USD', 99)).toEqual({
        price: '10',
        currency: 'USD',
        placeholder: '99',
      });
    });

    it('treats zero placeholder as falsy (returns undefined)', () => {
      expect(convertToPrice('10', 'USD', 0)).toEqual({
        price: '10',
        currency: 'USD',
        placeholder: undefined,
      });
    });
  });

  describe('formatCurrency', () => {
    it('formats whole number without decimals', () => {
      expect(formatCurrency(1000)).toBe('1\u00a0000');
    });

    it('formats decimal number with 2 decimal places', () => {
      expect(formatCurrency(1000.9)).toBe('1\u00a0000,90');
    });

    it('formats string decimal number', () => {
      expect(formatCurrency('100.9')).toBe('100,90');
    });

    it('formats string whole number without decimals', () => {
      expect(formatCurrency('1000')).toBe('1\u00a0000');
    });

    it('returns empty string for undefined', () => {
      expect(formatCurrency(undefined)).toBe('');
    });

    it('returns empty string for null', () => {
      expect(formatCurrency(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(formatCurrency('')).toBe('');
    });

    it('returns original string for non-numeric input', () => {
      expect(formatCurrency('abc')).toBe('abc');
    });

    it('formats zero without decimals', () => {
      expect(formatCurrency(0)).toBe('0');
    });
  });
});
