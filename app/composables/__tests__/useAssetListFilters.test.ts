/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, describe, it, expect, vi } from 'vitest';

const { channels, fetchChannels } = vi.hoisted(() => ({
  channels: {
    value: [] as { _id: string; name: string; identifier: string }[],
  },
  fetchChannels: vi.fn(),
}));

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useAccountStore', () => () => ({ channels, fetchChannels }));
mockNuxtImport('storeToRefs', () => (store: { channels: unknown }) => ({
  channels: store.channels,
}));

import { useAssetListFilters } from '../useAssetListFilters';

afterEach(() => {
  channels.value = [];
  fetchChannels.mockReset();
});

describe('useAssetListFilters', () => {
  it('defines type, channel and modified', () => {
    const { definitions } = useAssetListFilters();
    expect(definitions.map((d) => [d.name, d.kind])).toEqual([
      ['assetTypes', 'multiselect'],
      ['channels', 'multiselect'],
      ['modified', 'dateRange'],
    ]);
    expect(definitions[0]?.urlKey).toBe('type');
  });

  it('lists every asset type with its label and icon', () => {
    const [type] = useAssetListFilters().definitions;
    const options = type?.kind === 'multiselect' ? type.options : [];
    expect(Array.isArray(options) && options.map((o) => o.value)).toEqual([
      'image',
      'svg',
      'doc',
      'pdf',
      'video',
      'audio',
      'other',
    ]);
    expect(Array.isArray(options) && options[0]).toMatchObject({
      label: 'asset_library.asset_type.image',
      icon: 'Image',
    });
  });

  it('loads channel options by id, fetching when the store is empty', async () => {
    fetchChannels.mockResolvedValue([
      { _id: 'c1', name: 'Web', identifier: 'web' },
      { _id: 'c2', name: '', identifier: 'b2b' },
    ]);
    const channel = useAssetListFilters().definitions[1];
    const load = channel?.kind === 'multiselect' ? channel.options : [];
    expect(typeof load === 'function' && (await load())).toEqual([
      { value: 'c1', label: 'Web' },
      { value: 'c2', label: 'b2b' },
    ]);
    expect(fetchChannels).toHaveBeenCalledOnce();
  });

  it('reuses loaded channels', async () => {
    channels.value = [{ _id: 'c1', name: 'Web', identifier: 'web' }];
    const channel = useAssetListFilters().definitions[1];
    const load = channel?.kind === 'multiselect' ? channel.options : [];
    if (typeof load === 'function') await load();
    expect(fetchChannels).not.toHaveBeenCalled();
  });

  it('maps the modified range onto modifiedFrom / modifiedTo', () => {
    const { toQueryFilters } = useAssetListFilters();
    expect(
      toQueryFilters({
        assetTypes: ['pdf'],
        channels: ['c1'],
        modified: { from: '2026-09-01T00:00:00.000Z' },
      }),
    ).toEqual({
      assetTypes: ['pdf'],
      channels: ['c1'],
      modifiedFrom: '2026-09-01T00:00:00.000Z',
      modifiedTo: undefined,
    });
  });

  it('resolves a modified preset to concrete dates', () => {
    const { modifiedFrom, modifiedTo } = useAssetListFilters().toQueryFilters({
      modified: { preset: 'today' },
    });
    expect(modifiedFrom).toBeTypeOf('string');
    expect(modifiedTo).toBeTypeOf('string');
  });

  it('sends no date bounds without a modified filter', () => {
    expect(useAssetListFilters().toQueryFilters({})).toEqual({
      modifiedFrom: undefined,
      modifiedTo: undefined,
    });
  });
});
