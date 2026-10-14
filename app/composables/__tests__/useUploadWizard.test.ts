// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { useUploadWizard } from '../useUploadWizard';

function wizardWith(count: number) {
  const wizard = useUploadWizard();
  wizard.addFiles(
    Array.from({ length: count }, (_, i) => new File(['x'], `f${i}.png`)),
  );
  return { wizard, ids: wizard.files.value.map((f) => f.id) };
}

describe('useUploadWizard label limits', () => {
  it('passes lists within the limits', () => {
    const { wizard, ids } = wizardWith(1);
    wizard.patchSettings(ids[0]!, { tags: ['a'], channels: ['1|se'] });
    expect(wizard.labelLimitError(ids, 'tags')).toBeNull();
    expect(wizard.hasLabelLimitError.value).toBe(false);
  });

  it('reports the first breach across the given files', () => {
    const { wizard, ids } = wizardWith(2);
    wizard.patchSettings(ids[1]!, { tags: ['x'.repeat(65)] });
    expect(wizard.labelLimitError([ids[0]!], 'tags')).toBeNull();
    expect(wizard.labelLimitError(ids, 'tags')).toBe('length');
    expect(wizard.hasLabelLimitError.value).toBe(true);
  });

  it('counts normalized values, so case duplicates do not breach', () => {
    const { wizard, ids } = wizardWith(1);
    const channels = Array.from({ length: 50 }, (_, i) => `c${i}`);
    wizard.patchSettings(ids[0]!, { channels: [...channels, 'C0'] });
    expect(wizard.labelLimitError(ids, 'channels')).toBeNull();
    wizard.patchSettings(ids[0]!, { channels: [...channels, 'c50'] });
    expect(wizard.labelLimitError(ids, 'channels')).toBe('count');
  });

  it('clears once the offending file is removed', () => {
    const { wizard, ids } = wizardWith(2);
    wizard.patchSettings(ids[0]!, { languages: ['x'.repeat(51)] });
    expect(wizard.hasLabelLimitError.value).toBe(true);
    wizard.removeFiles([ids[0]!]);
    expect(wizard.hasLabelLimitError.value).toBe(false);
  });
});
