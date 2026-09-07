import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetReviewRow } from '#components';

function makeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('AssetReviewRow', () => {
  it('renders name, size and resolved metadata', async () => {
    const row = await mountWithContext(AssetReviewRow, {
      props: {
        name: 'Hero banner',
        file: makeFile('hero.jpg', 'image/jpeg', 2_400_000),
        folderName: 'Marketing',
        tags: ['summer', 'campaign'],
        channelNames: ['Web'],
      },
    });
    const text = row.text();
    expect(text).toContain('Hero banner');
    expect(text).toContain('2.3 MB');
    expect(text).toContain('Marketing');
    expect(text).toContain('summer, campaign');
    expect(text).toContain('Web');
  });

  it('falls back to the no-folder label when no folder is given', async () => {
    const row = await mountWithContext(AssetReviewRow, {
      props: {
        name: 'doc.pdf',
        file: makeFile('doc.pdf', 'application/pdf', 1024),
        tags: [],
        channelNames: [],
      },
    });
    // The i18n stub renders the raw key when unresolved.
    expect(row.text()).toMatch(/no_folder|No folder/i);
  });
});
