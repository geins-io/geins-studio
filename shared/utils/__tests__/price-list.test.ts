// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { PriceListContent, PriceListProduct } from '#shared/types';
import {
  companyPriceListContentFromSource,
  companyPriceListCreateBody,
  companyPriceListIdentifier,
  companyPriceListName,
  companyPriceListUpdateBody,
  getCompanyPriceListSaveAction,
  getFreeCompanyPriceListSlots,
  getPriceListSummaryCounts,
  isCompanyPriceListEntryDirty,
  isOwnAccountPriceList,
  priceListDraftRules,
  priceListForceOptions,
} from '../price-list';

describe('priceListForceOptions', () => {
  it('forces a write to a read-only list', () => {
    expect(priceListForceOptions({ readOnly: true })).toEqual({
      force: 'true',
    });
  });

  it('sends no force for an editable list', () => {
    expect(priceListForceOptions({ readOnly: false })).toEqual({});
  });
});

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
    expect(
      getCompanyPriceListSaveAction(
        { active: true, readOnly: true },
        true,
        true,
      ),
    ).toBe('none');
  });

  it('updates a list whose content changed, with or without a switch change', () => {
    expect(getCompanyPriceListSaveAction(active, true, true)).toBe('update');
    expect(getCompanyPriceListSaveAction(inactive, true, true)).toBe('update');
    expect(getCompanyPriceListSaveAction(active, false, true)).toBe('update');
  });

  it('creates or skips a missing list whatever its content', () => {
    expect(getCompanyPriceListSaveAction(undefined, true, true)).toBe('create');
    expect(getCompanyPriceListSaveAction(undefined, false, true)).toBe('none');
  });
});

const selection: NonNullable<PriceListContent['productSelectionQuery']> = {
  include: [{ selections: [{ categoryIds: ['12'] }] }],
  exclude: [],
};

const content: PriceListContent = {
  rules: [
    { _id: 'r1', internalId: 'tmp-1', quantity: 1, margin: 20, global: true },
    {
      internalId: 'tmp-2',
      quantity: 10,
      discountPercent: 5,
      applied: true,
      global: true,
    },
  ],
  productSelectionQuery: selection,
  products: [
    // A GET row carries all three price fields; its mode picks one.
    {
      _id: 'p1',
      productId: '100',
      staggeredCount: 1,
      priceMode: 'margin',
      price: 80,
      margin: 25,
      discountPercent: 10,
      name: 'Chair',
    },
    { productId: '101', staggeredCount: 1, price: 99 },
    { productId: '102', staggeredCount: 1 },
    { productId: '103', staggeredCount: 5, delete: true },
  ],
};

describe('companyPriceListCreateBody', () => {
  const company = {
    companyId: 'acc-1',
    companyName: 'Sonora Lab AB',
    externalId: '10234',
    channel: '1',
    currency: 'SEK',
  };

  it('creates an active, empty account list without content', () => {
    expect(companyPriceListCreateBody(company)).toEqual({
      name: 'Sonora Lab AB SEK',
      identifier: '10234-SEK',
      channel: '1',
      currency: 'SEK',
      wholesaleAccountId: 'acc-1',
      active: true,
      exVat: true,
      autoAddProducts: false,
      forced: false,
      dateCreated: '',
    });
  });

  it('includes the channel in the name and identifier when given its name', () => {
    const body = companyPriceListCreateBody({
      ...company,
      channelName: 'Sweden',
    });
    expect(body.name).toBe('Sonora Lab AB Sweden SEK');
    expect(body.identifier).toBe('10234-1-SEK');
  });

  it('creates an inactive list when asked', () => {
    expect(
      companyPriceListCreateBody({ ...company, active: false }).active,
    ).toBe(false);
  });

  it('keeps the exVat it is given', () => {
    expect(companyPriceListCreateBody({ ...company, exVat: false }).exVat).toBe(
      false,
    );
  });

  it('adds rules without ids, the whole selection and only priced rows', () => {
    const body = companyPriceListCreateBody({ ...company, content });
    expect(body.rules).toStrictEqual([
      { quantity: 1, margin: 20 },
      { quantity: 10, discountPercent: 5 },
    ]);
    expect(body.productSelectionQuery).toEqual(selection);
    expect(body.products).toStrictEqual([
      { productId: '100', staggeredCount: 1, margin: 25 },
      { productId: '101', staggeredCount: 1, price: 99 },
    ]);
  });
});

describe('companyPriceListUpdateBody', () => {
  const active = { active: true };

  it('sends only active for a switch change', () => {
    expect(companyPriceListUpdateBody(active, false)).toStrictEqual({
      active: false,
    });
    expect(companyPriceListUpdateBody({ active: false }, true)).toStrictEqual({
      active: true,
    });
  });

  it('sends the content in full, rules with their ids', () => {
    expect(companyPriceListUpdateBody(active, true, content)).toStrictEqual({
      rules: [
        { _id: 'r1', quantity: 1, margin: 20 },
        { quantity: 10, discountPercent: 5 },
      ],
      productSelectionQuery: selection,
      products: [
        { productId: '100', staggeredCount: 1, margin: 25 },
        { productId: '101', staggeredCount: 1, price: 99 },
        // A bare row resets it to auto.
        { productId: '102', staggeredCount: 1 },
        { productId: '103', staggeredCount: 5, delete: true },
      ],
    });
  });

  it('sends an active change together with the content', () => {
    const body = companyPriceListUpdateBody(active, false, content);
    expect(body.active).toBe(false);
    expect(body.rules).toHaveLength(2);
  });

  it('keeps a zero margin and resets a fixed row without a price', () => {
    expect(
      companyPriceListUpdateBody(active, true, {
        rules: [{ _id: 'r1', quantity: 1, margin: 0 }],
        products: [
          { productId: '100', staggeredCount: 1, margin: 0 },
          { productId: '101', staggeredCount: 1, priceMode: 'fixed' },
        ],
      }),
    ).toStrictEqual({
      rules: [{ _id: 'r1', quantity: 1, margin: 0 }],
      products: [
        { productId: '100', staggeredCount: 1, margin: 0 },
        { productId: '101', staggeredCount: 1 },
      ],
    });
  });

  it('leaves out content fields that are undefined, but sends empty ones', () => {
    expect(
      companyPriceListUpdateBody(active, true, { rules: [], products: [] }),
    ).toStrictEqual({ rules: [], products: [] });
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

  it('puts the channel name before the currency', () => {
    expect(companyPriceListName('Sonora Lab AB', 'SEK', 'Sweden')).toBe(
      'Sonora Lab AB Sweden SEK',
    );
  });
});

describe('companyPriceListIdentifier', () => {
  it('joins the external id and the currency', () => {
    expect(companyPriceListIdentifier('10234', 'SEK')).toBe('10234-SEK');
  });

  it('puts the channel id before the currency', () => {
    expect(companyPriceListIdentifier('10234', 'SEK', '2')).toBe('10234-2-SEK');
  });

  it('is left out without an external id', () => {
    expect(companyPriceListIdentifier(undefined, 'SEK')).toBeUndefined();
    expect(companyPriceListIdentifier('', 'SEK')).toBeUndefined();
    expect(companyPriceListIdentifier('  ', 'SEK', '2')).toBeUndefined();
  });
});

describe('getFreeCompanyPriceListSlots', () => {
  const currencies: Record<string, string[]> = {
    '1': ['SEK', 'EUR'],
    '2': ['NOK'],
    '3': [],
  };
  const getCurrencies = (channel: string) => currencies[channel] ?? [];

  it('offers every currency of every channel without lists', () => {
    expect(getFreeCompanyPriceListSlots(['1', '2'], getCurrencies, [])).toEqual(
      [
        { channel: '1', currencies: ['SEK', 'EUR'] },
        { channel: '2', currencies: ['NOK'] },
      ],
    );
  });

  it('counts saved lists and drafts as taken', () => {
    const erpList = { _id: 'erp', channel: '1', currency: 'SEK' };
    const draft = { channel: '2', currency: 'NOK' };
    expect(
      getFreeCompanyPriceListSlots(['1', '2'], getCurrencies, [erpList, draft]),
    ).toEqual([{ channel: '1', currencies: ['EUR'] }]);
  });

  it('leaves out channels with nothing free, and channels without currencies', () => {
    expect(
      getFreeCompanyPriceListSlots(['1', '3'], getCurrencies, [
        { channel: '1', currency: 'SEK' },
        { channel: '1', currency: 'EUR' },
      ]),
    ).toEqual([]);
  });

  it('ignores lists in channels the company is not in', () => {
    expect(
      getFreeCompanyPriceListSlots(['2'], getCurrencies, [
        { channel: '1', currency: 'NOK' },
      ]),
    ).toEqual([{ channel: '2', currencies: ['NOK'] }]);
  });
});

describe('isCompanyPriceListEntryDirty', () => {
  const clean = {
    saved: { active: true },
    active: true,
    readOnly: false,
    contentDirty: false,
  };

  it('is clean when the entry matches its saved list', () => {
    expect(isCompanyPriceListEntryDirty(clean)).toBe(false);
  });

  it('is dirty for a draft, active or not', () => {
    expect(isCompanyPriceListEntryDirty({ ...clean, saved: undefined })).toBe(
      true,
    );
    expect(
      isCompanyPriceListEntryDirty({
        ...clean,
        saved: undefined,
        active: false,
      }),
    ).toBe(true);
  });

  it('is dirty when the switch differs from the saved list', () => {
    expect(isCompanyPriceListEntryDirty({ ...clean, active: false })).toBe(
      true,
    );
  });

  it('is dirty when the content was edited, even while inactive', () => {
    expect(
      isCompanyPriceListEntryDirty({
        ...clean,
        saved: { active: false },
        active: false,
        contentDirty: true,
      }),
    ).toBe(true);
  });

  it('is never dirty for a read-only list', () => {
    expect(
      isCompanyPriceListEntryDirty({
        ...clean,
        readOnly: true,
        active: false,
        contentDirty: true,
      }),
    ).toBe(false);
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

describe('priceListDraftRules', () => {
  const rules = [
    { _id: 'r1', quantity: 1, margin: 20, discountPercent: 0, global: true },
    { _id: 'r2', quantity: 10, discountPercent: 5, applied: true },
  ];

  it('keeps the quantity, the set percentage and the id', () => {
    expect(priceListDraftRules(rules)).toStrictEqual([
      { _id: 'r1', quantity: 1, margin: 20 },
      { _id: 'r2', quantity: 10, discountPercent: 5 },
    ]);
  });

  it('leaves the ids out for a new list', () => {
    expect(priceListDraftRules(rules, false)).toStrictEqual([
      { quantity: 1, margin: 20 },
      { quantity: 10, discountPercent: 5 },
    ]);
  });

  it('has no rules for a list without any', () => {
    expect(priceListDraftRules(undefined)).toEqual([]);
  });
});

describe('companyPriceListContentFromSource', () => {
  const source = {
    _id: 'shared-1',
    rules: [
      { _id: 'r1', quantity: 1, discountPercent: 10, global: true },
      { _id: 'r2', quantity: 10, discountPercent: 15 },
    ],
    productSelectionQuery: selection,
  };
  // GET rows carry all three price fields; the mode says which one is set.
  const row = (
    productId: string,
    priceMode: PriceListProduct['priceMode'],
    staggeredCount = 1,
  ): PriceListProduct => ({
    _id: `row-${productId}-${staggeredCount}`,
    productId,
    staggeredCount,
    priceMode,
    price: 80,
    margin: 25,
    discountPercent: 10,
    ruleId: 'r1',
    name: 'Chair',
  });

  it('takes the rules without ids and the whole selection', () => {
    const content = companyPriceListContentFromSource(source);
    expect(content.rules).toStrictEqual([
      { quantity: 1, discountPercent: 10 },
      { quantity: 10, discountPercent: 15 },
    ]);
    expect(content.productSelectionQuery).toEqual(selection);
    expect(content.products).toEqual([]);
  });

  it('keeps manual rows, volume breaks included, with only their price', () => {
    const content = companyPriceListContentFromSource(source, [
      row('100', 'fixed'),
      row('101', 'margin'),
      row('102', 'discount'),
      row('102', 'fixed', 10),
    ]);
    expect(content.products).toStrictEqual([
      { productId: '100', staggeredCount: 1, price: 80 },
      { productId: '101', staggeredCount: 1, margin: 25 },
      { productId: '102', staggeredCount: 1, discountPercent: 10 },
      { productId: '102', staggeredCount: 10, price: 80 },
    ]);
  });

  it('leaves out rule, auto and unpriced rows', () => {
    const content = companyPriceListContentFromSource(source, [
      row('100', 'rule'),
      row('101', 'auto'),
      row('102', 'autoRule'),
      row('103', 'autoFixed'),
      row('104', undefined),
      { productId: '105', staggeredCount: 1, priceMode: 'fixed' },
    ]);
    expect(content.products).toEqual([]);
  });

  it('leaves out a selection the source has none of', () => {
    const content = companyPriceListContentFromSource({ rules: [] });
    expect(content).not.toHaveProperty('productSelectionQuery');
    expect(content.rules).toEqual([]);
  });

  it('builds a create body with no ids anywhere', () => {
    const body = companyPriceListCreateBody({
      companyId: 'acc-1',
      companyName: 'Sonora Lab AB',
      channel: '1',
      currency: 'SEK',
      content: companyPriceListContentFromSource(source, [
        row('100', 'margin'),
        row('100', 'margin', 5),
      ]),
    });
    expect(JSON.stringify(body)).not.toMatch(/"_id"|internalId|ruleId/);
    expect(body.products).toHaveLength(2);
  });
});
