import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetThumbnail } from '#components';

describe('AssetThumbnail', () => {
  it('renders the image scaled to the size preset', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: {
        type: 'image',
        url: 'https://cdn/x.jpg?v=1',
        alt: 'Hero',
        size: 'banner',
      },
    });
    const img = thumb.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(
      'https://cdn/x.jpg?v=1&width=500&height=250&fit=crop&dpr=2',
    );
    expect(img.attributes('alt')).toBe('Hero');
  });

  it('renders the typed icon block with a label for a non-image type', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: { type: 'pdf', url: 'https://cdn/doc.pdf' },
    });
    expect(thumb.find('img').exists()).toBe(false);
    expect(thumb.text()).toBe('asset_library.asset_type.pdf');
  });

  it('falls back to the typed icon when the image fails to load', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: { type: 'image', url: 'https://cdn/gone.jpg' },
    });
    expect(thumb.find('img').exists()).toBe(true);
    await thumb.find('img').trigger('error');
    expect(thumb.find('img').exists()).toBe(false);
    expect(thumb.text()).toBe('asset_library.asset_type.image');
  });

  it('hides the label in the compact row size', async () => {
    const thumb = await mountWithContext(AssetThumbnail, {
      props: { type: 'pdf', url: null, size: 'row' },
    });
    expect(thumb.text()).toBe('');
  });
});
