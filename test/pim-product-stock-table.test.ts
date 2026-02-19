/**
 * @vitest-environment node
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
      expect(content).toContain('const { getColumns } = useColumns<Sku>()');
    });

    it('should have columns computed property with custom cell renderers', () => {
      expect(content).toContain('const columns = computed<ColumnDef<Sku>[]>(');
      expect(content).toContain('const baseColumns = getColumns(props.skus');
    });

    it('should configure includeColumns with stock fields', () => {
      expect(content).toContain('includeColumns:');
      expect(content).toContain('articleNumber');
      expect(content).toContain('stock');
      expect(content).toContain('stockSellable');
      expect(content).toContain('stockOversellable');
    });

    it('should have columnTitles configuration', () => {
      expect(content).toContain('columnTitles:');
      expect(content).toContain("articleNumber: 'Article Number'");
      expect(content).toContain("stock: 'Stock'");
      expect(content).toContain("stockSellable: 'Sellable Stock'");
      expect(content).toContain("stockOversellable: 'Oversellable Stock'");
    });

    it('should have isLowStock helper function', () => {
      expect(content).toContain('const isLowStock = (stock: number) => stock < 10');
    });

    it('should import required types and components including Badge', () => {
      expect(content).toContain("import type { Sku } from '#shared/types'");
      expect(content).toContain("import { TableMode } from '#shared/types'");
      expect(content).toContain("import { LucidePackage, Badge } from '#components'");
      expect(content).toContain("import { h } from 'vue'");
      expect(content).toContain("import type { ColumnDef, Table, Row } from '@tanstack/vue-table'");
    });

    it('should use i18n for translations', () => {
      expect(content).toContain("const { t } = useI18n()");
    });

    it('should use Badge component for low stock indicator', () => {
      expect(content).toContain("h(Badge, { variant: 'negative' }");
      expect(content).toContain("t('low_stock')");
    });

    it('should have custom cell renderer for stock columns', () => {
      // May alias table to _table: `cell: ({ row, table: _table }`
      expect(content).toMatch(/cell:\s*\(\{\s*row,\s*table/);
      expect(content).toContain("const lowStock = isLowStock(value)");
      expect(content).toContain("if (lowStock)");
    });

    it('should customize stock and stockSellable columns', () => {
      expect(content).toContain("if (columnId === 'stock' || columnId === 'stockSellable')");
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

    it('should use columns for table display', () => {
      expect(content).toContain(':columns="columns"');
    });

    it('should use skus for table data', () => {
      expect(content).toContain(':data="skus"');
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
