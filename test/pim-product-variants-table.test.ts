/**
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const componentPath = resolve(
  process.cwd(),
  'app/components/pim/ProductVariantsTable.vue',
);

describe('ProductVariantsTable Component', () => {
  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  const componentContent = existsSync(componentPath)
    ? readFileSync(componentPath, 'utf-8')
    : '';

  describe('Script Setup', () => {
    it('should import Sku type from shared types', () => {
      expect(componentContent).toContain("import type { Sku } from '#shared/types'");
    });

    it('should define Props interface with skus and loading', () => {
      expect(componentContent).toMatch(/interface Props\s*{/);
      expect(componentContent).toContain('skus: Sku[]');
      expect(componentContent).toContain('loading?: boolean');
    });

    it('should use withDefaults for props', () => {
      expect(componentContent).toContain('withDefaults(defineProps<Props>()');
      expect(componentContent).toMatch(/loading:\s*false/);
    });

    it('should use useColumns composable', () => {
      expect(componentContent).toContain('useColumns<Sku>');
    });

    it('should configure includeColumns with articleNumber, name, gtin, active', () => {
      expect(componentContent).toMatch(/includeColumns:\s*\[/);
      expect(componentContent).toContain("'articleNumber'");
      expect(componentContent).toContain("'name'");
      expect(componentContent).toContain("'gtin'");
      expect(componentContent).toContain("'active'");
    });

    it('should configure active column as status type', () => {
      expect(componentContent).toMatch(/columnTypes:\s*{/);
      expect(componentContent).toMatch(/active:\s*'status'/);
    });

    it('should configure column titles', () => {
      expect(componentContent).toMatch(/columnTitles:\s*{/);
      expect(componentContent).toMatch(/articleNumber:\s*['"]Article Number['"]/);
      expect(componentContent).toMatch(/name:\s*['"]Name['"]/);
      expect(componentContent).toMatch(/gtin:\s*['"]GTIN['"]/);
      expect(componentContent).toMatch(/active:\s*['"]Status['"]/);
    });
  });

  describe('Template', () => {
    it('should use TableView component', () => {
      expect(componentContent).toContain('<TableView');
    });

    it('should set mode to TableMode.Simple', () => {
      expect(componentContent).toContain(':mode="TableMode.Simple"');
    });

    it('should set entity-name to variant', () => {
      expect(componentContent).toMatch(/entity-name=["']variant["']/);
    });

    it('should bind columns prop', () => {
      expect(componentContent).toContain(':columns="columns"');
    });

    it('should bind data to skus prop', () => {
      expect(componentContent).toContain(':data="skus"');
    });

    it('should bind loading prop', () => {
      expect(componentContent).toContain(':loading="loading"');
    });

    it('should configure empty state text', () => {
      expect(componentContent).toContain(':empty-text="$t(\'product_no_variants\')"');
    });

    it('should configure empty state icon', () => {
      expect(componentContent).toContain(':empty-icon="LucidePackage"');
    });
  });
});

describe('Product Detail Page - Variants Tab Integration', () => {
  const pagePath = resolve(process.cwd(), 'app/pages/pim/product/[id].vue');

  it('should exist', () => {
    expect(existsSync(pagePath)).toBe(true);
  });

  const pageContent = existsSync(pagePath)
    ? readFileSync(pagePath, 'utf-8')
    : '';

  describe('Variants Tab Content', () => {
    it('should use ProductVariantsTable component in Variants tab', () => {
      expect(pageContent).toContain('<ProductVariantsTable');
    });

    it('should pass skus from entityData to ProductVariantsTable', () => {
      expect(pageContent).toMatch(/:skus=["']entityData\?\.skus\s*\|\|\s*\[\]["']/);
    });

    it('should pass loading state to ProductVariantsTable', () => {
      expect(pageContent).toMatch(/:loading=["']loading["']/);
    });

    it('should use ContentEditCard for Variants tab', () => {
      // Check that Variants tab uses ContentEditCard
      const variantsTabMatch = pageContent.match(
        /<!--\s*Variants Tab\s*-->[\s\S]*?<\/KeepAlive>/
      );
      expect(variantsTabMatch).toBeTruthy();
      if (variantsTabMatch) {
        expect(variantsTabMatch[0]).toContain('<ContentEditCard');
        expect(variantsTabMatch[0]).toContain('<ProductVariantsTable');
      }
    });

    it('should use variants translation key in Variants tab', () => {
      const variantsTabMatch = pageContent.match(
        /<!--\s*Variants Tab\s*-->[\s\S]*?<\/KeepAlive>/
      );
      expect(variantsTabMatch).toBeTruthy();
      if (variantsTabMatch) {
        expect(variantsTabMatch[0]).toContain(":title=\"$t('variants')\"");
      }
    });
  });
});

describe('i18n Keys', () => {
  const enPath = resolve(process.cwd(), 'i18n/locales/en.json');
  const svPath = resolve(process.cwd(), 'i18n/locales/sv.json');

  it('should have English locale file', () => {
    expect(existsSync(enPath)).toBe(true);
  });

  it('should have Swedish locale file', () => {
    expect(existsSync(svPath)).toBe(true);
  });

  const enContent = existsSync(enPath) ? readFileSync(enPath, 'utf-8') : '';
  const svContent = existsSync(svPath) ? readFileSync(svPath, 'utf-8') : '';

  describe('English Translations', () => {
    it('should have product_no_variants key', () => {
      expect(enContent).toContain('"product_no_variants"');
      expect(enContent).toMatch(/"product_no_variants":\s*"[^"]+"/);
    });
  });

  describe('Swedish Translations', () => {
    it('should have product_no_variants key', () => {
      expect(svContent).toContain('"product_no_variants"');
      expect(svContent).toMatch(/"product_no_variants":\s*"[^"]+"/);
    });
  });
});
