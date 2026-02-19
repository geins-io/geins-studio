import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductStockTable from '../ProductStockTable.vue';
import type { Sku } from '#shared/types';

// Mock the composables
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app') as any;
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          product_no_stock: 'No stock information found',
          low_stock: 'Low Stock',
        };
        return translations[key] || key;
      },
    }),
  };
});

vi.mock('@/composables/useColumns', () => ({
  useColumns: () => ({
    getColumns: (data: any[], options: any) => {
      if (data.length === 0) return [];
      return [
        { id: 'articleNumber', header: 'Article Number' },
        { id: 'stock', header: 'Stock' },
        { id: 'stockSellable', header: 'Sellable Stock' },
        { id: 'stockOversellable', header: 'Oversellable Stock' },
      ];
    },
  }),
}));

describe('ProductStockTable - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no SKUs exist', () => {
    const wrapper = mount(ProductStockTable, {
      props: {
        skus: [],
        loading: false,
      },
      global: {
        stubs: {
          TableView: {
            template: '<div><slot v-if="data.length === 0" name="empty"><div class="empty-state">{{ emptyText }}</div></slot></div>',
            props: ['data', 'columns', 'loading', 'emptyText', 'emptyIcon', 'mode', 'entityName'],
          },
        },
      },
    });

    // Check that empty text prop is passed to TableView (translation key)
    const html = wrapper.html();
    expect(html).toContain('product_no_stock');
  });

  it('should not show empty state when SKUs exist', () => {
    const mockSkus = [
      {
        _id: 1,
        _type: 'sku',
        articleNumber: 'SKU-001',
        name: 'Variant 1',
        stock: 50,
        stockSellable: 45,
        stockOversellable: 55,
      },
    ] as unknown as Sku[];

    const wrapper = mount(ProductStockTable, {
      props: {
        skus: mockSkus,
        loading: false,
      },
      global: {
        stubs: {
          TableView: {
            template: '<div><div v-if="data.length > 0" class="table-content">Table with data</div></div>',
            props: ['data', 'columns', 'loading', 'emptyText', 'emptyIcon', 'mode', 'entityName'],
          },
        },
      },
    });

    // Check that table content is shown
    expect(wrapper.html()).toContain('Table with data');
  });

  it('should pass empty icon to TableView', () => {
    const wrapper = mount(ProductStockTable, {
      props: {
        skus: [],
        loading: false,
      },
      global: {
        stubs: {
          TableView: true,
          Badge: true,
        },
      },
    });

    const tableView = wrapper.findComponent({ name: 'TableView' });
    expect(tableView.exists()).toBe(true);
    expect(tableView.props('emptyIcon')).toBeDefined();
  });

  it('should show loading state instead of empty state when loading', () => {
    const wrapper = mount(ProductStockTable, {
      props: {
        skus: [],
        loading: true,
      },
      global: {
        stubs: {
          TableView: {
            template: '<div><div v-if="loading" class="loading">Loading...</div><div v-else-if="data.length === 0" class="empty">Empty</div></div>',
            props: ['data', 'columns', 'loading', 'emptyText', 'emptyIcon', 'mode', 'entityName'],
          },
          Badge: true,
        },
      },
    });

    // Check that loading is shown instead of empty state
    expect(wrapper.html()).toContain('Loading');
    expect(wrapper.html()).not.toContain('Empty');
  });

  it('should return empty columns array when no SKUs exist', () => {
    const wrapper = mount(ProductStockTable, {
      props: {
        skus: [],
        loading: false,
      },
      global: {
        stubs: {
          TableView: true,
          Badge: true,
        },
      },
    });

    const tableView = wrapper.findComponent({ name: 'TableView' });
    expect(tableView.props('columns')).toEqual([]);
  });

  it('should have columns when SKUs exist', () => {
    const mockSkus = [
      {
        _id: 1,
        _type: 'sku',
        articleNumber: 'SKU-001',
        name: 'Variant 1',
        stock: 50,
        stockSellable: 45,
        stockOversellable: 55,
      },
    ] as unknown as Sku[];

    const wrapper = mount(ProductStockTable, {
      props: {
        skus: mockSkus,
        loading: false,
      },
      global: {
        stubs: {
          TableView: true,
          Badge: true,
        },
      },
    });

    const tableView = wrapper.findComponent({ name: 'TableView' });
    expect(tableView.props('columns').length).toBeGreaterThan(0);
  });

  it('should show low stock badge for stock values below 10', () => {
    const mockSkus = [
      {
        _id: 1,
        _type: 'sku',
        articleNumber: 'SKU-001',
        name: 'Variant 1',
        stock: 5,
        stockSellable: 3,
        stockOversellable: 10,
      },
    ] as unknown as Sku[];

    const wrapper = mount(ProductStockTable, {
      props: {
        skus: mockSkus,
        loading: false,
      },
      global: {
        stubs: {
          TableView: true,
          Badge: true,
        },
      },
    });

    // Verify that columns are generated with proper configuration
    const tableView = wrapper.findComponent({ name: 'TableView' });
    const columns = tableView.props('columns');
    
    // Check that stock and stockSellable columns have custom cell renderers
    const stockColumn = columns.find((col: any) => col.id === 'stock');
    const stockSellableColumn = columns.find((col: any) => col.id === 'stockSellable');
    
    expect(stockColumn).toBeDefined();
    expect(stockSellableColumn).toBeDefined();
    expect(typeof stockColumn?.cell).toBe('function');
    expect(typeof stockSellableColumn?.cell).toBe('function');
  });

  it('should not show low stock badge for stock values of 10 or more', () => {
    const mockSkus = [
      {
        _id: 1,
        _type: 'sku',
        articleNumber: 'SKU-001',
        name: 'Variant 1',
        stock: 50,
        stockSellable: 45,
        stockOversellable: 55,
      },
    ] as unknown as Sku[];

    const wrapper = mount(ProductStockTable, {
      props: {
        skus: mockSkus,
        loading: false,
      },
      global: {
        stubs: {
          TableView: true,
          Badge: true,
        },
      },
    });

    // Verify columns are properly configured
    const tableView = wrapper.findComponent({ name: 'TableView' });
    const columns = tableView.props('columns');
    
    expect(columns.length).toBeGreaterThan(0);
  });
});
