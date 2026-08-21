/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));

import { useAssetType } from '../useAssetType';

describe('useAssetType', () => {
  const { meta, label } = useAssetType();

  it('returns presentation metadata per type', () => {
    expect(meta('image')).toMatchObject({
      labelKey: 'asset_type.image',
      variant: 'blue',
      icon: 'Image',
    });
    expect(meta('svg').variant).toBe('teal');
    expect(meta('pdf').variant).toBe('rose');
    expect(meta('video').icon).toBe('Film');
  });

  it('carries a tint class matching the type', () => {
    expect(meta('audio').tint).toContain('amber');
  });

  it('falls back to "other" for an unknown type', () => {
    expect(meta('bogus' as never)).toBe(meta('other'));
    expect(meta('bogus' as never).labelKey).toBe('asset_type.other');
  });

  it("label() resolves the type's label key via t", () => {
    expect(label('doc')).toBe('asset_type.doc');
    expect(label('other')).toBe('asset_type.other');
  });
});
