/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';

// The index derivation is the logic under test, so stand the store up with a
// ready product list instead of exercising its fetch.
const products = [
  {
    _id: '033126',
    name: 'Padded jacket',
    articleNumber: 'ART-1',
    thumbnail: 'a.jpg',
  },
  {
    _id: '44011',
    name: 'Wool scarf',
    articleNumber: '0777',
    thumbnail: 'b.jpg',
  },
];

mockNuxtImport('useProductsStore', () => () => ({
  init: vi.fn(),
  products: ref(products),
  ready: ref(true),
}));

mockNuxtImport('storeToRefs', () => (store: Record<string, unknown>) => store);

import { useProductMatch } from '../useProductMatch';

describe('useProductMatch', () => {
  const { matchById, matchOf } = useProductMatch();

  it('matches on product id and article number, ignoring case and padding', () => {
    expect(matchById('033126')?.name).toBe('Padded jacket');
    expect(matchById('art-1')?.name).toBe('Padded jacket');
    expect(matchById(' 44011 ')?.name).toBe('Wool scarf');
  });

  it('matches a link target whose leading zero the API stripped', () => {
    // Geins.Media writes `033126` as `33126`, so the raw id alone would miss.
    expect(matchById('33126')?.name).toBe('Padded jacket');
    expect(matchById('777')?.name).toBe('Wool scarf');
  });

  it('never lets an alias shadow another product exact key', () => {
    // '44011' is a real id; nothing unpadded may claim it first.
    expect(matchById('44011')?._id).toBe('44011');
  });

  it('returns null for an unknown or empty reference', () => {
    expect(matchById('nope')).toBeNull();
    expect(matchById('')).toBeNull();
  });

  it('only matches image uploads with a filename ref', () => {
    const image = new File([''], '33126_hero.jpg', { type: 'image/jpeg' });
    expect(matchOf(image)?.name).toBe('Padded jacket');

    const noRef = new File([''], 'hero.jpg', { type: 'image/jpeg' });
    expect(matchOf(noRef)).toBeNull();

    const notImage = new File([''], '33126_spec.pdf', {
      type: 'application/pdf',
    });
    expect(matchOf(notImage)).toBeNull();
  });
});
