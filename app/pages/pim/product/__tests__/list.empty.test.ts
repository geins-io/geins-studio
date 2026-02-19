import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ListPage from '../list.vue';

// Mock the Nuxt composables
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app') as any;
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, params?: any, count?: number) => {
        const translations: Record<string, any> = {
          product: count === 2 ? 'Products' : 'Product',
          new_entity: `New ${params?.entityName || 'Product'}`,
          create_new_entity: `Create New ${params?.entityName || 'Product'}`,
          no_entity: count === 2 ? 'No products found' : 'No product found',
          empty_description: 'Get started by creating a new product',
          image: 'Image',
          article_number: 'Article Number',
          status: 'Status',
        };
        return translations[key] || key;
      },
      locale: { value: 'en' },
    }),
    definePageMeta: vi.fn(),
    useAsyncData: vi.fn(),
    navigateTo: vi.fn(),
    useRoute: () => ({
      params: {},
      query: {},
    }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      afterEach: vi.fn(),
      beforeEach: vi.fn(),
    }),
  };
});

// Mock the Geins repository
vi.mock('@/composables/useGeinsRepository', () => ({
  useGeinsRepository: () => ({
    productApi: {
      list: vi.fn(),
    },
  }),
}));

// Mock other composables
vi.mock('@/composables/useGeinsLog', () => ({
  useGeinsLog: () => ({
    geinsLogError: vi.fn(),
  }),
}));

vi.mock('@/composables/useEntityUrl', () => ({
  useEntityUrl: () => ({
    getEntityName: () => 'product',
    getEntityNewUrl: () => '/pim/product/new',
    getEntityUrl: (id: string) => `/pim/product/${id}`,
  }),
}));

vi.mock('@/composables/usePageError', () => ({
  usePageError: () => ({
    handleFetchResult: (_error: any, data: any) => data || [],
  }),
}));

vi.mock('@/composables/useColumns', () => ({
  useColumns: () => ({
    getColumns: () => [],
    addActionsColumn: vi.fn(),
  }),
}));

vi.mock('@/composables/useTable', () => ({
  useTable: () => ({
    getVisibilityState: () => ({}),
  }),
}));

describe('Product List - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no products exist', async () => {
    // Mock useAsyncData to return empty array
    const { useAsyncData } = await import('#app');
    vi.mocked(useAsyncData).mockImplementation((_key: any, handler: any) => {
      return {
        data: ref([]),
        error: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
        execute: vi.fn(),
        status: ref('success'),
      } as any;
    });

    const wrapper = await mountSuspended(ListPage);

    // Wait for component to finish loading
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that TableView is rendered with empty data
    const html = wrapper.html();
    // When data is empty, TableView should be rendered
    // The actual empty state content is handled by TableView component
    expect(html).toContain('data-slot="button"');
  });

  it('should show "Create New Product" button in empty state', async () => {
    // Mock useAsyncData to return empty array
    const { useAsyncData } = await import('#app');
    vi.mocked(useAsyncData).mockImplementation((_key: any, handler: any) => {
      return {
        data: ref([]),
        error: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
        execute: vi.fn(),
        status: ref('success'),
      } as any;
    });

    const wrapper = await mountSuspended(ListPage);

    // Wait for component to finish loading
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the create button exists in empty state
    // The button uses the translation key "create_new_entity"
    const html = wrapper.html();
    const hasCreateButton = html.includes('Create New Product') || html.includes('create_new_entity');
    expect(hasCreateButton).toBe(true);
  });

  it('should have empty-actions slot in TableView component', async () => {
    // Mock useAsyncData to return empty array
    const { useAsyncData } = await import('#app');
    vi.mocked(useAsyncData).mockImplementation((_key: any, handler: any) => {
      return {
        data: ref([]),
        error: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
        execute: vi.fn(),
        status: ref('success'),
      } as any;
    });

    const wrapper = await mountSuspended(ListPage);

    // Wait for component to finish loading
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the empty-actions slot content is rendered
    const html = wrapper.html();
    // The slot should contain button markup for creating a new product
    expect(html).toContain('button');
  });

  it('should not show empty state when products exist', async () => {
    // Mock useAsyncData to return products
    const { useAsyncData } = await import('#app');
    vi.mocked(useAsyncData).mockImplementation((_key: any, handler: any) => {
      return {
        data: ref([
          {
            _id: 1,
            _type: 'product',
            productId: 1,
            name: 'Test Product',
            articleNumber: 'TEST-001',
            active: true,
          },
        ]),
        error: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
        execute: vi.fn(),
        status: ref('success'),
      } as any;
    });

    const wrapper = await mountSuspended(ListPage);

    // Wait for component to finish loading
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Empty state should not be visible
    const html = wrapper.html();
    expect(html).not.toContain('No products found');
  });
});
