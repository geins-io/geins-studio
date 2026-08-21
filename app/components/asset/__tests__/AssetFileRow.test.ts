import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetFileRow } from '#components';

function makeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type });
  // File size is derived from content; override for a deterministic assertion.
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('AssetFileRow', () => {
  it('shows the file name and formatted size', async () => {
    const row = await mountWithContext(AssetFileRow, {
      props: { file: makeFile('hero.jpg', 'image/jpeg', 2_400_000) },
    });
    expect(row.text()).toContain('hero.jpg');
    expect(row.text()).toContain('2.3 MB');
  });

  it('emits remove when the remove button is clicked', async () => {
    const row = await mountWithContext(AssetFileRow, {
      props: { file: makeFile('doc.pdf', 'application/pdf', 1024) },
    });
    await row.find('button').trigger('click');
    expect(row.emitted('remove')).toHaveLength(1);
  });
});
