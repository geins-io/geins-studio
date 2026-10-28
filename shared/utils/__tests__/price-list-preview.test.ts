// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { calculatePriceListPrices, isPreviewId } from '../price-list-preview';

describe('isPreviewId', () => {
  it('is true for a made-up preview id', () => {
    expect(isPreviewId('new_3f2a')).toBe(true);
  });

  it('is false for a saved id or none', () => {
    expect(isPreviewId('42')).toBe(false);
    expect(isPreviewId(undefined)).toBe(false);
  });
});

describe('calculatePriceListPrices', () => {
  // Price 100 at a 40% margin puts the cost at 60, in list-price terms.
  const base = { price: 100, margin: 40, regularPrice: 120 };

  it('works out margin and discount from a price', () => {
    expect(calculatePriceListPrices('price', 90, base)).toEqual({
      price: 90,
      margin: 33.33,
      discountPercent: 25,
    });
  });

  it('works out price and margin from a discount', () => {
    expect(calculatePriceListPrices('discountPercent', 50, base)).toEqual({
      price: 60,
      margin: 0,
      discountPercent: 50,
    });
  });

  it('works out price and discount from a margin', () => {
    expect(calculatePriceListPrices('margin', 25, base)).toEqual({
      price: 80,
      margin: 25,
      discountPercent: 33.33,
    });
  });

  it('gives a price of 0 a full discount and no margin', () => {
    expect(calculatePriceListPrices('price', 0, base)).toEqual({
      price: 0,
      margin: undefined,
      discountPercent: 100,
    });
  });

  it('leaves the margin out without a previewed price', () => {
    expect(
      calculatePriceListPrices('price', 90, { regularPrice: 120 }),
    ).toEqual({ price: 90, margin: undefined, discountPercent: 25 });
  });

  it('leaves price and discount out for a margin it cannot reach', () => {
    expect(calculatePriceListPrices('margin', 100, base)).toEqual({
      price: undefined,
      margin: 100,
      discountPercent: undefined,
    });
  });

  it('leaves price and margin out for a discount without a regular price', () => {
    expect(
      calculatePriceListPrices('discountPercent', 10, {
        price: 100,
        margin: 40,
      }),
    ).toEqual({ price: undefined, margin: undefined, discountPercent: 10 });
  });
});
