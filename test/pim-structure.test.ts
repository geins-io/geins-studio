// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('PIM Module Structure', () => {
  const projectRoot = join(__dirname, '..');

  it('should have app/pages/pim directory', () => {
    const pimPagesPath = join(projectRoot, 'app/pages/pim');
    expect(existsSync(pimPagesPath)).toBe(true);
  });

  it('should have app/pages/pim/product directory', () => {
    const pimProductPagesPath = join(projectRoot, 'app/pages/pim/product');
    expect(existsSync(pimProductPagesPath)).toBe(true);
  });

  it('should have app/components/pim directory', () => {
    const pimComponentsPath = join(projectRoot, 'app/components/pim');
    expect(existsSync(pimComponentsPath)).toBe(true);
  });
});
