// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));

import { useAssetType } from '../useAssetType';

describe('useAssetType', () => {
  const { meta, label } = useAssetType();

  it('returns presentation metadata per type', () => {
    expect(meta('image')).toMatchObject({
      labelKey: 'asset_library.asset_type.image',
      variant: 'info',
      icon: 'Image',
    });
    expect(meta('svg').variant).toBe('teal');
    expect(meta('pdf').variant).toBe('pink');
    expect(meta('audio').variant).toBe('warning');
    expect(meta('video').icon).toBe('Film');
  });

  it('carries a tint class matching the type', () => {
    expect(meta('pdf').tint).toContain('tone-pink');
    expect(meta('audio').tint).toContain('tone-warning');
  });

  // Doc is slate, so Other must not be, or the two read as the same type.
  it('keeps "other" apart from "doc"', () => {
    expect(meta('other').variant).toBe('neutral');
    expect(meta('doc').variant).toBe('slate');
  });

  it('falls back to "other" for an unknown type', () => {
    expect(meta('bogus' as never)).toBe(meta('other'));
    expect(meta('bogus' as never).labelKey).toBe(
      'asset_library.asset_type.other',
    );
  });

  it("label() resolves the type's label key via t", () => {
    expect(label('doc')).toBe('asset_library.asset_type.doc');
    expect(label('other')).toBe('asset_library.asset_type.other');
  });
});
