// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isOwnAccountPriceList, pickAccountPriceList } from '../price-list';

describe('isOwnAccountPriceList', () => {
  it('is true for an account list owned by the account', () => {
    expect(
      isOwnAccountPriceList(
        { accountSpecific: true, wholesaleAccountId: '42' },
        '42',
      ),
    ).toBe(true);
  });

  it('is false for an account list owned by another account', () => {
    expect(
      isOwnAccountPriceList(
        { accountSpecific: true, wholesaleAccountId: '7' },
        '42',
      ),
    ).toBe(false);
  });

  it('is false for a shared list, which sends an empty owner id', () => {
    expect(
      isOwnAccountPriceList(
        { accountSpecific: false, wholesaleAccountId: '' },
        '42',
      ),
    ).toBe(false);
    expect(
      isOwnAccountPriceList(
        { accountSpecific: false, wholesaleAccountId: '' },
        '',
      ),
    ).toBe(false);
  });

  it('trusts accountSpecific over a stray owner id', () => {
    expect(
      isOwnAccountPriceList(
        { accountSpecific: false, wholesaleAccountId: '42' },
        '42',
      ),
    ).toBe(false);
  });
});

describe('pickAccountPriceList', () => {
  const sek = { _id: 'a', channel: '1', currency: 'SEK' };
  const eur = { _id: 'b', channel: '1', currency: 'EUR' };
  const other = { _id: 'c', channel: '2', currency: 'SEK' };

  it('picks the list in the default channel and currency', () => {
    expect(pickAccountPriceList([sek, eur, other], '1', 'EUR')).toEqual({
      priceList: eur,
      fallback: false,
    });
  });

  it('falls back to the first list when none matches', () => {
    expect(pickAccountPriceList([other, sek], '3', 'NOK')).toEqual({
      priceList: other,
      fallback: true,
    });
  });

  it('falls back to the only list without a default channel', () => {
    expect(pickAccountPriceList([sek])).toEqual({
      priceList: sek,
      fallback: true,
    });
  });

  it('returns no list for a company without account lists', () => {
    expect(pickAccountPriceList([], '1', 'SEK')).toEqual({
      priceList: undefined,
      fallback: false,
    });
  });
});
