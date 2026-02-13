// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { usePrice } from '../usePrice';

describe('usePrice', () => {
  const { convertToPrice } = usePrice();

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
