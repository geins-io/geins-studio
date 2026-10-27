// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  companyPriceListIdentifier,
  companyPriceListName,
  getCompanyPriceListSaveAction,
  getPriceListSummaryCounts,
  isOwnAccountPriceList,
  pickAccountPriceList,
} from '../price-list';

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

describe('getCompanyPriceListSaveAction', () => {
  const active = { active: true, readOnly: false };
  const inactive = { active: false, readOnly: false };

  it('creates a list when switched on without one', () => {
    expect(getCompanyPriceListSaveAction(undefined, true)).toBe('create');
  });

  it('does nothing when switched off without a list', () => {
    expect(getCompanyPriceListSaveAction(undefined, false)).toBe('none');
  });

  it('activates an inactive list when switched on', () => {
    expect(getCompanyPriceListSaveAction(inactive, true)).toBe('activate');
  });

  it('deactivates an active list when switched off', () => {
    expect(getCompanyPriceListSaveAction(active, false)).toBe('deactivate');
  });

  it('does nothing when the switch matches the list', () => {
    expect(getCompanyPriceListSaveAction(active, true)).toBe('none');
    expect(getCompanyPriceListSaveAction(inactive, false)).toBe('none');
  });

  it('never saves a read-only list', () => {
    expect(
      getCompanyPriceListSaveAction({ active: true, readOnly: true }, false),
    ).toBe('none');
  });
});

describe('companyPriceListName', () => {
  it('joins the company name and the currency', () => {
    expect(companyPriceListName('Sonora Lab AB', 'SEK')).toBe(
      'Sonora Lab AB SEK',
    );
  });

  it('trims the company name', () => {
    expect(companyPriceListName(' Sonora Lab AB ', 'SEK')).toBe(
      'Sonora Lab AB SEK',
    );
  });
});

describe('companyPriceListIdentifier', () => {
  it('joins the external id and the currency', () => {
    expect(companyPriceListIdentifier('10234', 'SEK')).toBe('10234-SEK');
  });

  it('is left out without an external id', () => {
    expect(companyPriceListIdentifier(undefined, 'SEK')).toBeUndefined();
    expect(companyPriceListIdentifier('', 'SEK')).toBeUndefined();
    expect(companyPriceListIdentifier('  ', 'SEK')).toBeUndefined();
  });
});

describe('getPriceListSummaryCounts', () => {
  it('returns both counts when the API sends numbers', () => {
    expect(
      getPriceListSummaryCounts({
        manualPriceProductCount: 3,
        volumePriceProductCount: 0,
      }),
    ).toEqual({ manual: 3, volume: 0 });
  });

  it('hides the counts while either one is null', () => {
    expect(
      getPriceListSummaryCounts({
        manualPriceProductCount: null,
        volumePriceProductCount: null,
      }),
    ).toBeUndefined();
    expect(
      getPriceListSummaryCounts({
        manualPriceProductCount: 2,
        volumePriceProductCount: null,
      }),
    ).toBeUndefined();
  });

  it('hides the counts without a list or when they were not requested', () => {
    expect(getPriceListSummaryCounts(undefined)).toBeUndefined();
    expect(getPriceListSummaryCounts(null)).toBeUndefined();
    expect(getPriceListSummaryCounts({})).toBeUndefined();
  });
});
