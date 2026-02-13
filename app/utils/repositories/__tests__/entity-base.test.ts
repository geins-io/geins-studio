// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityGetRepo, entityListRepo, entityBaseRepo } from '../entity-base';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

describe('entityGetRepo', () => {
  const repo = entityGetRepo('/products', mockFetch);

  it('calls fetch with correct endpoint and id', async () => {
    mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
    await repo.get('1');
    expect(mockFetch).toHaveBeenCalledWith('/products/1', {
      query: undefined,
    });
  });

  it('returns the fetched entity', async () => {
    const entity = { _id: '42', _type: 'product', name: 'Widget' };
    mockFetch.mockResolvedValue(entity);
    const result = await repo.get('42');
    expect(result).toEqual(entity);
  });

  it('passes field selection as query object', async () => {
    mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
    await repo.get('1', { fields: ['name', 'price'] });
    expect(mockFetch).toHaveBeenCalledWith('/products/1', {
      query: { fields: 'name,price' },
    });
  });

  it('passes undefined query when options have no fields', async () => {
    mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
    await repo.get('1', { fields: [] });
    expect(mockFetch).toHaveBeenCalledWith('/products/1', {
      query: undefined,
    });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(repo.get('1')).rejects.toThrow('Network error');
  });
});

describe('entityListRepo', () => {
  const repo = entityListRepo('/products', mockFetch);

  it('calls fetch with /list endpoint', async () => {
    mockFetch.mockResolvedValue([]);
    await repo.list();
    expect(mockFetch).toHaveBeenCalledWith('/products/list', {
      query: undefined,
    });
  });

  it('returns an array of entities', async () => {
    const items = [
      { _id: '1', _type: 'product' },
      { _id: '2', _type: 'product' },
    ];
    mockFetch.mockResolvedValue(items);
    const result = await repo.list();
    expect(result).toEqual(items);
    expect(result).toHaveLength(2);
  });

  it('passes field selection as query object', async () => {
    mockFetch.mockResolvedValue([]);
    await repo.list({ fields: ['id', 'name'] });
    expect(mockFetch).toHaveBeenCalledWith('/products/list', {
      query: { fields: 'id,name' },
    });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Server error'));
    await expect(repo.list()).rejects.toThrow('Server error');
  });
});

describe('entityBaseRepo', () => {
  it('combines get and list operations', async () => {
    const repo = entityBaseRepo('/products', mockFetch);
    expect(typeof repo.get).toBe('function');
    expect(typeof repo.list).toBe('function');
  });

  it('get delegates to entityGetRepo logic', async () => {
    const repo = entityBaseRepo('/orders', mockFetch);
    mockFetch.mockResolvedValue({ _id: '5', _type: 'order' });
    const result = await repo.get('5');
    expect(mockFetch).toHaveBeenCalledWith('/orders/5', { query: undefined });
    expect(result).toEqual({ _id: '5', _type: 'order' });
  });

  it('list delegates to entityListRepo logic', async () => {
    const repo = entityBaseRepo('/orders', mockFetch);
    mockFetch.mockResolvedValue([{ _id: '1', _type: 'order' }]);
    const result = await repo.list();
    expect(mockFetch).toHaveBeenCalledWith('/orders/list', {
      query: undefined,
    });
    expect(result).toHaveLength(1);
  });
});
