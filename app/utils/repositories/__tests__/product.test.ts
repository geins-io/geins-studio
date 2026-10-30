// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityRepo } from '../entity';

// product.ts reads these Nuxt auto-imports at module load.
vi.hoisted(() => {
  vi.stubGlobal('useBatchQuery', () => ({
    batchQueryMatchAll: { value: {} },
    batchQueryNoPagination: { value: {} },
  }));
});
vi.stubGlobal('repo', { entity: entityRepo });

const { productRepo } = await import('../product');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

describe('productRepo.priceList.id().delete', () => {
  const api = productRepo(mockFetch);

  it('sends force=true for a read-only list', async () => {
    await api.priceList.id('7').delete({ force: 'true' });
    expect(mockFetch).toHaveBeenCalledWith('/product/pricelist/7', {
      method: 'DELETE',
      query: { force: 'true' },
      errorContext: { action: 'deleting', entity: 'price_list' },
    });
  });

  it('sends no query without options', async () => {
    await api.priceList.id('7').delete();
    expect(mockFetch).toHaveBeenCalledWith('/product/pricelist/7', {
      method: 'DELETE',
      query: undefined,
      errorContext: { action: 'deleting', entity: 'price_list' },
    });
  });

  it('forwards fetch options', async () => {
    await api.priceList.id('7').delete({}, { suppressErrorToast: true });
    expect(mockFetch).toHaveBeenCalledWith(
      '/product/pricelist/7',
      expect.objectContaining({ suppressErrorToast: true }),
    );
  });
});
