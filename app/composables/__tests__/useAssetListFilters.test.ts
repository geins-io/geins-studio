// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { afterEach, describe, it, expect, vi } from 'vitest';

const { channels, fetchChannels, languages, fetchLanguages } = vi.hoisted(
  () => ({
    channels: {
      value: [] as { _id: string; name: string; identifier: string }[],
    },
    fetchChannels: vi.fn(),
    languages: { value: [] as { _id: string; name: string }[] },
    fetchLanguages: vi.fn(),
  }),
);

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useAccountStore', () => () => ({
  channels,
  fetchChannels,
  languages,
  fetchLanguages,
}));
mockNuxtImport(
  'storeToRefs',
  () => (store: { channels: unknown; languages: unknown }) => ({
    channels: store.channels,
    languages: store.languages,
  }),
);

import { useAssetListFilters } from '../useAssetListFilters';

afterEach(() => {
  channels.value = [];
  fetchChannels.mockReset();
  languages.value = [];
  fetchLanguages.mockReset();
});

describe('useAssetListFilters', () => {
  it('defines type, channel, content language and modified', () => {
    const { definitions } = useAssetListFilters();
    expect(definitions.map((d) => [d.name, d.kind])).toEqual([
      ['assetTypes', 'multiselect'],
      ['channels', 'multiselect'],
      ['languages', 'multiselect'],
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

  it('loads language options by code, fetching when the store is empty', async () => {
    fetchLanguages.mockResolvedValue([
      { _id: 'sv', name: 'Svenska' },
      { _id: 'en', name: '' },
    ]);
    const language = useAssetListFilters().definitions[2];
    const load = language?.kind === 'multiselect' ? language.options : [];
    expect(typeof load === 'function' && (await load())).toEqual([
      { value: 'sv', label: 'Svenska' },
      { value: 'en', label: 'en' },
    ]);
    expect(fetchLanguages).toHaveBeenCalledOnce();
  });

  it('reuses loaded languages', async () => {
    languages.value = [{ _id: 'sv', name: 'Svenska' }];
    const language = useAssetListFilters().definitions[2];
    const load = language?.kind === 'multiselect' ? language.options : [];
    if (typeof load === 'function') await load();
    expect(fetchLanguages).not.toHaveBeenCalled();
  });

  it('maps the modified range onto modifiedFrom / modifiedTo', () => {
    const { toQueryFilters } = useAssetListFilters();
    expect(
      toQueryFilters({
        assetTypes: ['pdf'],
        channels: ['c1'],
        languages: ['sv'],
        modified: { from: '2026-09-01T00:00:00.000Z' },
      }),
    ).toEqual({
      assetTypes: ['pdf'],
      channels: ['c1'],
      languages: ['sv'],
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
