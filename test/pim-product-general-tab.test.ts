/**
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('PIM Product Detail - General Tab Form', () => {
  const productDetailPath = resolve(
    process.cwd(),
    'app/pages/pim/product/[id].vue',
  );

  it('should have the product detail page file', () => {
    expect(existsSync(productDetailPath)).toBe(true);
  });

  describe('Form Fields', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should have name field with FormField component', () => {
      expect(content).toContain('name="default.name"');
      expect(content).toContain('FormField');
      expect(content).toContain('FormLabel');
      expect(content).toContain('FormControl');
      expect(content).toContain('FormMessage');
    });

    it('should have articleNumber field with FormField component', () => {
      expect(content).toContain('name="default.articleNumber"');
    });

    it('should have brand field as Select dropdown', () => {
      expect(content).toContain('name="default.brandId"');
      expect(content).toContain('Select');
      expect(content).toContain('SelectTrigger');
      expect(content).toContain('SelectValue');
      expect(content).toContain('SelectContent');
      expect(content).toContain('SelectItem');
    });

    it('should have categories field with multi-select', () => {
      expect(content).toContain('name="default.categoryIds"');
      expect(content).toContain('TagsInput');
      expect(content).toContain('ComboboxRoot');
      expect(content).toContain('multiple');
    });

    it('should have description field using Textarea', () => {
      expect(content).toContain('name="default.description"');
      expect(content).toContain('Textarea');
    });
  });

  describe('Validation Schema', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should use zod schema with required name field', () => {
      expect(content).toContain('import * as z from');
      expect(content).toContain('name: z.string().min(1');
    });

    it('should use zod schema with required articleNumber field', () => {
      expect(content).toContain('articleNumber: z.string().min(1');
    });

    it('should have optional brandId field in schema', () => {
      expect(content).toContain('brandId: z.number().optional()');
    });

    it('should have optional description field in schema', () => {
      expect(content).toContain('description: z.string().optional()');
    });

    it('should have optional categoryIds array field in schema', () => {
      expect(content).toContain('categoryIds: z.array(z.number()).optional()');
    });
  });

  describe('Store Integration', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should use productsStore for brands and categories', () => {
      expect(content).toContain('useProductsStore');
      expect(content).toContain('brands');
      expect(content).toContain('categories');
      expect(content).toContain('storeToRefs');
    });

    it('should populate brand dropdown from productsStore.brands', () => {
      expect(content).toContain('v-for="brand in brands"');
      expect(content).toContain('brand._id');
      expect(content).toContain('brand.name');
    });

    it('should populate categories from productsStore.categories', () => {
      expect(content).toContain('v-for="category in categories"');
      expect(content).toContain('category._id');
      expect(content).toContain('category.name');
    });
  });

  describe('Form Initialization', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should initialize form with brandId from entity data', () => {
      expect(content).toContain('brandId: entityData.brandId');
    });

    it('should initialize form with description from localizations', () => {
      expect(content).toContain('description:');
      expect(content).toContain('localizations');
      expect(content).toContain('text1');
    });

    it('should initialize form with categoryIds from categories array', () => {
      expect(content).toContain('categoryIds:');
      expect(content).toContain('categories?.map');
    });
  });

  describe('Form Data Preparation', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should prepare create data with localizations', () => {
      expect(content).toContain('prepareCreateData');
      expect(content).toContain('localizations');
    });

    it('should prepare update data with localizations', () => {
      expect(content).toContain('prepareUpdateData');
      expect(content).toContain('localizations');
    });

    it('should handle entity undefined in prepareUpdateData', () => {
      expect(content).toContain('if (!entity)');
    });
  });

  describe('i18n Keys', () => {
    const enPath = resolve(process.cwd(), 'i18n/locales/en.json');
    const svPath = resolve(process.cwd(), 'i18n/locales/sv.json');
    const enContent = readFileSync(enPath, 'utf-8');
    const svContent = readFileSync(svPath, 'utf-8');

    it('should have select_brand key in English', () => {
      expect(enContent).toContain('"select_brand"');
    });

    it('should have select_brand key in Swedish', () => {
      expect(svContent).toContain('"select_brand"');
    });

    it('should have select_categories key in English', () => {
      expect(enContent).toContain('"select_categories"');
    });

    it('should have select_categories key in Swedish', () => {
      expect(svContent).toContain('"select_categories"');
    });

    it('should have categories key in English', () => {
      expect(enContent).toContain('"categories"');
    });

    it('should have categories key in Swedish', () => {
      expect(svContent).toContain('"categories"');
    });

    it('should have description key in English', () => {
      expect(enContent).toContain('"description"');
    });

    it('should have description key in Swedish', () => {
      expect(svContent).toContain('"description"');
    });

    it('should have no_results key in English', () => {
      expect(enContent).toContain('"no_results"');
    });

    it('should have no_results key in Swedish', () => {
      expect(svContent).toContain('"no_results"');
    });
  });

  describe('UI Layout', () => {
    const content = readFileSync(productDetailPath, 'utf-8');

    it('should use FormGrid for layout', () => {
      expect(content).toContain('FormGrid');
      expect(content).toContain('FormGridWrap');
    });

    it('should have 1+1 grid for name and article number', () => {
      expect(content).toContain('design="1+1"');
    });

    it('should have 1+1 grid for brand and categories', () => {
      const grids = content.match(/design="1\+1"/g);
      expect(grids).toBeTruthy();
      expect(grids!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have single column grid for description', () => {
      expect(content).toContain('design="1"');
    });
  });
});
