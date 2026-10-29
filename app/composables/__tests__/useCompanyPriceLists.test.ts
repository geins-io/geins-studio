// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import type {
  CustomerPriceList,
  PriceListContent,
  ProductPriceListCreate,
  ProductPriceListUpdate,
} from '#shared/types';

const { create, update, get } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  get: vi.fn(),
}));

mockNuxtImport('useGeinsRepository', () => () => ({
  productApi: { priceList: { create, update, get } },
}));
mockNuxtImport('useAccountStore', () => () => ({
  getChannelNameById: (id: string) => (id === '2' ? 'Norway' : 'Sweden'),
}));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError: vi.fn() }));

import { useCompanyPriceLists } from '../customers/useCompanyPriceLists';

const list = (
  _id: string,
  overrides: Partial<CustomerPriceList> = {},
): CustomerPriceList => ({
  _id,
  _type: 'pricelist',
  name: `List ${_id}`,
  channel: '1',
  currency: 'SEK',
  active: true,
  exVat: true,
  accountSpecific: true,
  wholesaleAccountId: 'acc-1',
  readOnly: false,
  productCount: 0,
  ...overrides,
});

const content: PriceListContent = {
  rules: [{ quantity: 1, margin: 20 }],
};

function setup(channels = ['1']) {
  const company = ref({ name: 'Sonora Lab AB', externalId: '10234', channels });
  const onSaved = vi.fn();
  const lists = useCompanyPriceLists({
    companyId: 'acc-1',
    company,
    onSaved,
  });
  return { ...lists, onSaved };
}

beforeEach(() => {
  vi.clearAllMocks();
  update.mockImplementation((id: string, body: ProductPriceListUpdate) =>
    Promise.resolve(list(id, { active: body.active ?? true })),
  );
  create.mockImplementation((body: ProductPriceListCreate) =>
    Promise.resolve(
      list('new-1', {
        name: body.name,
        channel: body.channel,
        currency: body.currency,
        active: body.active,
      }),
    ),
  );
});

describe('merge', () => {
  it('adds an entry per list, keyed by its id', () => {
    const { entries, merge, hasChanges } = setup();
    merge([list('a'), list('b', { currency: 'EUR', readOnly: true })]);
    expect(entries.value.map((e) => [e.key, e.currency, e.readOnly])).toEqual([
      ['a', 'SEK', false],
      ['b', 'EUR', true],
    ]);
    expect(hasChanges.value).toBe(false);
  });

  it('keeps drafts and their content', () => {
    const { entries, merge, addDraft } = setup();
    merge([list('a')]);
    const key = addDraft({ channel: '1', currency: 'EUR' });
    entries.value[1]!.content = content;
    merge([list('a')]);
    expect(entries.value.map((e) => e.key)).toEqual(['a', key]);
    expect(entries.value[1]!.content).toEqual(content);
  });

  it('keeps an unsaved switch change and refreshes the server fields', () => {
    const { entries, merge, hasChanges } = setup();
    merge([list('a'), list('b')]);
    entries.value[0]!.active = false;
    merge([list('a', { productCount: 5 }), list('b', { active: false })]);
    expect(entries.value[0]).toMatchObject({ active: false, productCount: 5 });
    // An untouched switch follows the server.
    expect(entries.value[1]!.active).toBe(false);
    expect(hasChanges.value).toBe(true);
  });

  it('keeps edited content through a reload', () => {
    const { entries, merge, hasChanges } = setup();
    merge([list('a')]);
    Object.assign(entries.value[0]!, { content, contentDirty: true });
    merge([list('a')]);
    expect(entries.value[0]).toMatchObject({ content, contentDirty: true });
    expect(hasChanges.value).toBe(true);
  });

  it('drops a list that is gone and returns its key', () => {
    const { entries, merge } = setup();
    merge([list('a'), list('b')]);
    expect(merge([list('b'), list('erp', { readOnly: true })])).toEqual(['a']);
    expect(entries.value.map((e) => e.key)).toEqual(['b', 'erp']);
  });
});

describe('drafts', () => {
  it('counts a draft as a change until it is removed', () => {
    const { entries, merge, addDraft, removeDraft, hasChanges } = setup();
    merge([list('a')]);
    const key = addDraft({ channel: '1', currency: 'EUR' }, false);
    expect(key).toMatch(/^draft-/);
    expect(entries.value[1]).toMatchObject({ active: false, readOnly: false });
    expect(hasChanges.value).toBe(true);
    removeDraft(key);
    removeDraft('a');
    expect(entries.value.map((e) => e.key)).toEqual(['a']);
    expect(hasChanges.value).toBe(false);
  });
});

describe('seedFor', () => {
  it('names a list after the company and currency', () => {
    const { seedFor } = setup();
    expect(seedFor({ channel: '1', currency: 'SEK' })).toMatchObject({
      name: 'Sonora Lab AB SEK',
      identifier: '10234-SEK',
      wholesaleAccountId: 'acc-1',
    });
  });

  it('adds the channel for a company in more than one channel', () => {
    const { seedFor } = setup(['1', '2']);
    expect(seedFor({ channel: '2', currency: 'SEK' })).toMatchObject({
      name: 'Sonora Lab AB Norway SEK',
      identifier: '10234-2-SEK',
    });
  });
});

describe('save', () => {
  it('saves nothing when nothing changed', async () => {
    const { merge, save } = setup();
    merge([list('a'), list('erp', { readOnly: true })]);
    expect(await save()).toBe(true);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a draft with its active state and keeps its key', async () => {
    const { entries, addDraft, save, hasChanges, onSaved } = setup(['1', '2']);
    const key = addDraft({ channel: '2', currency: 'NOK' }, false);
    entries.value[0]!.content = content;

    expect(await save()).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sonora Lab AB Norway NOK',
        identifier: '10234-2-NOK',
        channel: '2',
        currency: 'NOK',
        active: false,
      }),
      { fields: ['rules', 'selectionquery'] },
    );
    // Content goes along only once it's edited.
    expect(create.mock.calls[0]![0]).not.toHaveProperty('rules');
    expect(entries.value[0]).toMatchObject({ key, active: false });
    expect(entries.value[0]!.saved?._id).toBe('new-1');
    expect(hasChanges.value).toBe(false);
    expect(onSaved).toHaveBeenCalledWith(
      entries.value[0],
      expect.objectContaining({ _id: 'new-1' }),
      'create',
    );
  });

  it('sends edited content even while the list is inactive', async () => {
    const { entries, merge, save, hasChanges, onSaved } = setup();
    merge([list('a', { active: false })]);
    Object.assign(entries.value[0]!, { content, contentDirty: true });

    expect(await save()).toBe(true);
    expect(update).toHaveBeenCalledWith(
      'a',
      { rules: [{ quantity: 1, margin: 20 }] },
      { fields: ['rules', 'selectionquery'] },
    );
    expect(hasChanges.value).toBe(false);
    expect(onSaved).toHaveBeenCalledWith(
      entries.value[0],
      expect.anything(),
      'update',
    );
  });

  it('reads the list back when the update returns nothing', async () => {
    const { entries, merge, save } = setup();
    merge([list('a')]);
    entries.value[0]!.active = false;
    update.mockResolvedValueOnce(undefined);
    get.mockResolvedValueOnce(list('a', { active: false }));

    expect(await save()).toBe(true);
    expect(update).toHaveBeenCalledWith(
      'a',
      { active: false },
      expect.anything(),
    );
    expect(get).toHaveBeenCalledWith('a', expect.anything());
    expect(entries.value[0]!.saved?.active).toBe(false);
  });

  it('stops at the first failure and keeps the saved lists clean', async () => {
    const { entries, merge, save, hasChanges } = setup();
    merge([list('a'), list('b'), list('c')]);
    entries.value.forEach((entry) => (entry.active = false));
    update.mockImplementation((id: string) =>
      id === 'b'
        ? Promise.reject(new Error('409'))
        : Promise.resolve(list(id, { active: false })),
    );

    expect(await save()).toBe(false);
    expect(update.mock.calls.map(([id]) => id)).toEqual(['a', 'b']);
    expect(entries.value.map((e) => e.saved?.active)).toEqual([
      false,
      true,
      true,
    ]);
    expect(hasChanges.value).toBe(true);

    // A retry only re-sends what's left.
    update.mockClear();
    update.mockImplementation((id: string) =>
      Promise.resolve(list(id, { active: false })),
    );
    expect(await save()).toBe(true);
    expect(update.mock.calls.map(([id]) => id)).toEqual(['b', 'c']);
    expect(hasChanges.value).toBe(false);
  });
});
