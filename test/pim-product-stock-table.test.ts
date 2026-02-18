/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

// =====================================================================================
// TEST: ProductStockTable Component
// =====================================================================================
describe('ProductStockTable Component', () => {
  const componentPath = 'app/components/pim/ProductStockTable.vue';

  it('should have ProductStockTable.vue file', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  describe('Script Setup', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should have Props interface with skus and loading', () => {
      expect(content).toContain('interface Props');
      expect(content).toContain('skus: Sku[]');
      expect(content).toContain('loading?: boolean');
    });

    it('should use useColumns composable', () => {
      expect(content).toContain('const { getColumns } = useColumns<EnrichedSkuData>()');
    });

    it('should have enrichedData computed property', () => {
      expect(content).toContain('const enrichedData = computed(');
      expect(content).toContain('stockDisplay');
      expect(content).toContain('stockSellableDisplay');
    });

    it('should have enrichedColumns computed property', () => {
      expect(content).toContain('const enrichedColumns = computed(');
      expect(content).toContain('return getColumns(enrichedData.value, columnOptions)');
    });

    it('should configure includeColumns with stock display fields', () => {
      expect(content).toContain('includeColumns:');
      expect(content).toContain('articleNumber');
      expect(content).toContain('stockDisplay');
      expect(content).toContain('stockSellableDisplay');
      expect(content).toContain('stockOversellable');
    });

    it('should have columnTitles configuration', () => {
      expect(content).toContain('columnTitles:');
      expect(content).toContain("articleNumber: 'Article Number'");
      expect(content).toContain("stockDisplay: 'Stock'");
      expect(content).toContain("stockSellableDisplay: 'Sellable Stock'");
      expect(content).toContain("stockOversellable: 'Oversellable Stock'");
    });

    it('should have EnrichedSkuData interface', () => {
      expect(content).toContain('interface EnrichedSkuData extends Sku');
      expect(content).toContain('stockDisplay: string');
      expect(content).toContain('stockSellableDisplay: string');
    });

    it('should have isLowStock helper function', () => {
      expect(content).toContain('const isLowStock = (stock: number) => stock < 10');
    });

    it('should import required types and components', () => {
      expect(content).toContain("import type { Sku } from '#shared/types'");
      expect(content).toContain("import { TableMode } from '#shared/types'");
      expect(content).toContain("import { LucidePackage } from '#components'");
      expect(content).toContain("import { h } from 'vue'");
    });

    it('should use i18n for translations', () => {
      expect(content).toContain("const { t } = useI18n()");
    });

    it('should include low stock indicator in display strings', () => {
      expect(content).toContain("isLowStock(sku.stock)");
      expect(content).toContain("t('low_stock')");
      expect(content).toContain("isLowStock(sku.stockSellable)");
    });
  });

  describe('Template', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should use TableView component in Simple mode', () => {
      expect(content).toContain('<TableView');
      expect(content).toContain(':mode="TableMode.Simple"');
    });

    it('should bind loading state to TableView', () => {
      expect(content).toContain(':loading="loading"');
    });

    it('should configure empty state with text and icon', () => {
      expect(content).toContain(':empty-text="$t(\'product_no_stock\')"');
      expect(content).toContain(':empty-icon="LucidePackage"');
    });

    it('should use enrichedColumns for table display', () => {
      expect(content).toContain(':columns="enrichedColumns"');
    });

    it('should use enrichedData for table data', () => {
      expect(content).toContain(':data="enrichedData"');
    });

    it('should set entity-name to "stock"', () => {
      expect(content).toContain('entity-name="stock"');
    });
  });
});

// =====================================================================================
// TEST: Product Detail Page - Stock Tab Integration
// =====================================================================================
describe('Product Detail Page - Stock Tab', () => {
  const pagePath = 'app/pages/pim/product/[id].vue';

  describe('Stock Tab Implementation', () => {
    const content = readFileSync(pagePath, 'utf-8');

    it('should use ProductStockTable component in Stock tab', () => {
      expect(content).toContain('<ProductStockTable');
    });

    it('should pass skus data to ProductStockTable', () => {
      // Find the Stock tab section (currentTab === 3)
      const stockTabSection = content.match(/v-if="currentTab === 3"[\s\S]*?<\/KeepAlive>/);
      expect(stockTabSection).toBeTruthy();
      expect(stockTabSection![0]).toContain(':skus="entityData?.skus || []"');
    });

    it('should pass loading state to ProductStockTable', () => {
      const stockTabSection = content.match(/v-if="currentTab === 3"[\s\S]*?<\/KeepAlive>/);
      expect(stockTabSection).toBeTruthy();
      expect(stockTabSection![0]).toContain(':loading="loading"');
    });

    it('should use ContentEditCard for Stock tab', () => {
      const stockTabSection = content.match(/v-if="currentTab === 3"[\s\S]*?<\/KeepAlive>/);
      expect(stockTabSection).toBeTruthy();
      expect(stockTabSection![0]).toContain('<ContentEditCard');
    });

    it('should have title and description for Stock tab', () => {
      const stockTabSection = content.match(/v-if="currentTab === 3"[\s\S]*?<\/KeepAlive>/);
      expect(stockTabSection).toBeTruthy();
      expect(stockTabSection![0]).toContain(':title="$t(\'stock\')"');
      expect(stockTabSection![0]).toContain(':description="$t(\'product_stock_description\')"');
    });

    it('should wrap Stock tab content in KeepAlive', () => {
      const stockTabSection = content.match(/<KeepAlive>[\s\S]*?v-if="currentTab === 3"[\s\S]*?<\/KeepAlive>/);
      expect(stockTabSection).toBeTruthy();
    });
  });
});

// =====================================================================================
// TEST: i18n Keys for Stock Tab
// =====================================================================================
describe('i18n Keys - Stock Tab', () => {
  describe('English Locale', () => {
    const enContent = readFileSync('i18n/locales/en.json', 'utf-8');
    const enJson = JSON.parse(enContent);

    it('should have product_no_stock key in en.json', () => {
      expect(enJson.product_no_stock).toBeDefined();
      expect(enJson.product_no_stock).toBe('No stock information found for this product');
    });

    it('should have low_stock key in en.json', () => {
      expect(enJson.low_stock).toBeDefined();
      expect(enJson.low_stock).toBe('Low Stock');
    });
  });

  describe('Swedish Locale', () => {
    const svContent = readFileSync('i18n/locales/sv.json', 'utf-8');
    const svJson = JSON.parse(svContent);

    it('should have product_no_stock key in sv.json', () => {
      expect(svJson.product_no_stock).toBeDefined();
      expect(svJson.product_no_stock).toBe('Ingen lagerinformation hittades för denna produkt');
    });

    it('should have low_stock key in sv.json', () => {
      expect(svJson.low_stock).toBeDefined();
      expect(svJson.low_stock).toBe('Lågt lager');
    });
  });
});
