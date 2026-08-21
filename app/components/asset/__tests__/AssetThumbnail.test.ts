import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetThumbnail } from '#components';

describe('AssetThumbnail', () => {
  it('renders the image when a thumbUrl is present', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: {
        type: 'image',
        thumbUrl: 'https://cdn/x.jpg',
        alt: 'Hero',
      },
    });
    const img = thumb.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://cdn/x.jpg');
    expect(img.attributes('alt')).toBe('Hero');
  });

  it('renders the typed icon block with a label when there is no thumbUrl', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: { type: 'pdf', thumbUrl: null },
    });
    expect(thumb.find('img').exists()).toBe(false);
    expect(thumb.text()).toBe('asset_library.asset_type.pdf');
  });

  it('hides the label in the compact row size', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: { type: 'pdf', thumbUrl: null, size: 'row' },
    });
    expect(thumb.text()).toBe('');
  });
});
