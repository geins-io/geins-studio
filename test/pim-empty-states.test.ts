/**
 * Test suite for US-019: PIM UI: Empty states
 * 
 * Tests empty state functionality across PIM components:
 * - Product list empty state with create action button
 * - Variants tab empty state
 * - Stock tab empty state
 * - Images tab empty state
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

describe('US-019: PIM Empty States', () => {
  describe('Product List Empty State', () => {
    it('should have empty-actions slot in TableView', () => {
      const content = readFileSync('app/pages/pim/product/list.vue', 'utf-8');
      
      // Verify template has empty-actions slot
      expect(content).toContain('<template #empty-actions>');
      
      // Verify slot contains ButtonIcon for creating new product
      expect(content).toContain('ButtonIcon');
      expect(content).toContain('icon="new"');
      expect(content).toContain('navigateTo(newEntityUrl)');
    });

    it('should have create action button in empty state', () => {
      const content = readFileSync('app/pages/pim/product/list.vue', 'utf-8');
      
      // Check for create button with proper variant
      expect(content).toContain('variant="secondary"');
      expect(content).toContain('create_new_entity');
    });

    it('should pass newEntityUrl to button navigation', () => {
      const content = readFileSync('app/pages/pim/product/list.vue', 'utf-8');
      
      // Verify navigation URL setup
      expect(content).toContain('const newEntityUrl = getEntityNewUrl()');
      expect(content).toContain('navigateTo(newEntityUrl)');
    });
  });

  describe('ProductVariantsTable Empty State', () => {
    it('should have empty-text prop configured', () => {
      const content = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      
      // Verify empty-text prop is passed to TableView
      expect(content).toContain(':empty-text="$t(\'product_no_variants\')"');
    });

    it('should have empty-icon prop with LucidePackage', () => {
      const content = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      
      // Verify empty-icon is set
      expect(content).toContain(':empty-icon="LucidePackage"');
      
      // Verify LucidePackage is imported
      expect(content).toContain('import { LucidePackage } from \'#components\'');
    });

    it('should show empty state when skus array is empty', () => {
      const content = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      
      // TableView will handle empty state when data is empty
      expect(content).toContain(':data="skus"');
      
      // Empty columns when no data
      expect(content).toContain('if (props.skus.length === 0) return []');
    });

    it('should have product_no_variants i18n key in English', () => {
      const enContent = readFileSync('i18n/locales/en.json', 'utf-8');
      const enJson = JSON.parse(enContent);
      
      expect(enJson).toHaveProperty('product_no_variants');
      expect(enJson.product_no_variants).toBe('No variants found for this product');
    });

    it('should have product_no_variants i18n key in Swedish', () => {
      const svContent = readFileSync('i18n/locales/sv.json', 'utf-8');
      const svJson = JSON.parse(svContent);
      
      expect(svJson).toHaveProperty('product_no_variants');
      expect(svJson.product_no_variants).toBe('Inga varianter hittades för denna produkt');
    });
  });

  describe('ProductStockTable Empty State', () => {
    it('should have empty-text prop configured', () => {
      const content = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      
      // Verify empty-text prop is passed to TableView
      expect(content).toContain(':empty-text="$t(\'product_no_stock\')"');
    });

    it('should have empty-icon prop with LucidePackage', () => {
      const content = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      
      // Verify empty-icon is set
      expect(content).toContain(':empty-icon="LucidePackage"');
      
      // Verify LucidePackage is imported (may be on same line with other imports)
      expect(content).toContain('LucidePackage');
      expect(content).toContain('from \'#components\'');
    });

    it('should show empty state when skus array is empty', () => {
      const content = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      
      // TableView will handle empty state when data is empty
      expect(content).toContain(':data="skus"');
      
      // Empty columns when no data
      expect(content).toContain('if (props.skus.length === 0) return []');
    });

    it('should have product_no_stock i18n key in English', () => {
      const enContent = readFileSync('i18n/locales/en.json', 'utf-8');
      const enJson = JSON.parse(enContent);
      
      expect(enJson).toHaveProperty('product_no_stock');
      expect(enJson.product_no_stock).toBe('No stock information found for this product');
    });

    it('should have product_no_stock i18n key in Swedish', () => {
      const svContent = readFileSync('i18n/locales/sv.json', 'utf-8');
      const svJson = JSON.parse(svContent);
      
      expect(svJson).toHaveProperty('product_no_stock');
      expect(svJson.product_no_stock).toBe('Ingen lagerinformation hittades för denna produkt');
    });
  });

  describe('ProductImageGallery Empty State', () => {
    it('should use Empty component from shadcn', () => {
      const content = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Verify Empty component usage
      expect(content).toContain('<Empty');
      expect(content).toContain('v-else-if="!hasImages"');
    });

    it('should use EmptyHeader with EmptyMedia and EmptyTitle', () => {
      const content = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Verify proper structure
      expect(content).toContain('<EmptyHeader>');
      expect(content).toContain('<EmptyMedia variant="icon">');
      expect(content).toContain('<LucideImage />');
      expect(content).toContain('</EmptyMedia>');
      expect(content).toContain('<EmptyTitle>');
      expect(content).toContain('$t(\'product_no_images\')');
      expect(content).toContain('</EmptyTitle>');
      expect(content).toContain('</EmptyHeader>');
    });

    it('should show empty state when media array is empty', () => {
      const content = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Verify hasImages computed property
      expect(content).toContain('const hasImages = computed');
      expect(content).toContain('props.media && props.media.length > 0');
      
      // Verify empty state conditional
      expect(content).toContain('v-else-if="!hasImages"');
    });

    it('should use LucideImage icon for empty state', () => {
      const content = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Verify icon import and usage
      expect(content).toContain('import { LucideImage } from \'#components\'');
      expect(content).toContain('<LucideImage />');
    });

    it('should have product_no_images i18n key in English', () => {
      const enContent = readFileSync('i18n/locales/en.json', 'utf-8');
      const enJson = JSON.parse(enContent);
      
      expect(enJson).toHaveProperty('product_no_images');
      expect(enJson.product_no_images).toBe('No images found for this product');
    });

    it('should have product_no_images i18n key in Swedish', () => {
      const svContent = readFileSync('i18n/locales/sv.json', 'utf-8');
      const svJson = JSON.parse(svContent);
      
      expect(svJson).toHaveProperty('product_no_images');
      expect(svJson.product_no_images).toBe('Inga bilder hittades för denna produkt');
    });
  });

  describe('Empty State Integration with Product Detail Page', () => {
    it('should integrate ProductVariantsTable with empty state in Variants tab', () => {
      const content = readFileSync('app/pages/pim/product/[id].vue', 'utf-8');
      
      // Verify ProductVariantsTable is used in Variants tab
      expect(content).toContain('<ProductVariantsTable');
      expect(content).toContain(':skus="entityData?.skus || []"');
      expect(content).toContain(':loading="loading"');
    });

    it('should integrate ProductStockTable with empty state in Stock tab', () => {
      const content = readFileSync('app/pages/pim/product/[id].vue', 'utf-8');
      
      // Verify ProductStockTable is used in Stock tab
      expect(content).toContain('<ProductStockTable');
      expect(content).toContain(':skus="entityData?.skus || []"');
      expect(content).toContain(':loading="loading"');
    });

    it('should integrate ProductImageGallery with empty state in Images tab', () => {
      const content = readFileSync('app/pages/pim/product/[id].vue', 'utf-8');
      
      // Verify ProductImageGallery is used in Images tab
      expect(content).toContain('<ProductImageGallery');
      expect(content).toContain(':media="entityData?.media || []"');
      expect(content).toContain(':loading="loading"');
    });
  });

  describe('Empty State Consistency', () => {
    it('should use consistent empty state patterns across components', () => {
      // All table-based components use TableView with empty-text and empty-icon
      const variantsContent = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      const stockContent = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      
      // Both should use TableView with empty props
      expect(variantsContent).toContain('TableView');
      expect(variantsContent).toContain(':empty-text=');
      expect(variantsContent).toContain(':empty-icon=');
      
      expect(stockContent).toContain('TableView');
      expect(stockContent).toContain(':empty-text=');
      expect(stockContent).toContain(':empty-icon=');
    });

    it('should use LucidePackage icon for table-based empty states', () => {
      const variantsContent = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      const stockContent = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      
      // Both should use LucidePackage for consistency
      expect(variantsContent).toContain('LucidePackage');
      expect(stockContent).toContain('LucidePackage');
    });

    it('should use LucideImage icon for image gallery empty state', () => {
      const imagesContent = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Images should use appropriate icon
      expect(imagesContent).toContain('LucideImage');
    });
  });

  describe('Empty State Actions', () => {
    it('should provide create action only in product list empty state', () => {
      const listContent = readFileSync('app/pages/pim/product/list.vue', 'utf-8');
      const variantsContent = readFileSync('app/components/pim/ProductVariantsTable.vue', 'utf-8');
      const stockContent = readFileSync('app/components/pim/ProductStockTable.vue', 'utf-8');
      const imagesContent = readFileSync('app/components/pim/ProductImageGallery.vue', 'utf-8');
      
      // Product list should have create action
      expect(listContent).toContain('empty-actions');
      expect(listContent).toContain('ButtonIcon');
      
      // Tab components should NOT have action buttons in empty states
      // (They show informational empty states only)
      expect(variantsContent).not.toContain('EmptyContent');
      expect(stockContent).not.toContain('EmptyContent');
      expect(imagesContent).not.toContain('EmptyContent'); // After update to use Empty component
    });
  });
});
