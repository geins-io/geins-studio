// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityRepo } from '../entity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

describe('entityRepo', () => {
  const repo = entityRepo('/products', mockFetch);

  describe('inherited read operations', () => {
    it('has get method from entityBaseRepo', () => {
      expect(typeof repo.get).toBe('function');
    });

    it('has list method from entityBaseRepo', () => {
      expect(typeof repo.list).toBe('function');
    });

    it('get calls fetch with correct endpoint', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
      await repo.get('1');
      expect(mockFetch).toHaveBeenCalledWith('/products/1', {
        query: undefined,
      });
    });

    it('list calls fetch with /list endpoint', async () => {
      mockFetch.mockResolvedValue([]);
      await repo.list();
      expect(mockFetch).toHaveBeenCalledWith('/products/list', {
        query: undefined,
      });
    });
  });

  describe('create', () => {
    it('sends POST request to entity endpoint', async () => {
      const payload = { name: 'New Product', price: 99 };
      mockFetch.mockResolvedValue({
        _id: '10',
        _type: 'product',
        ...payload,
      });
      await repo.create(payload);
      expect(mockFetch).toHaveBeenCalledWith('/products', {
        method: 'POST',
        body: payload,
        query: undefined,
      });
    });

    it('returns the created entity', async () => {
      const created = { _id: '10', _type: 'product', name: 'New' };
      mockFetch.mockResolvedValue(created);
      const result = await repo.create({ name: 'New' });
      expect(result).toEqual(created);
    });

    it('passes field selection as query', async () => {
      mockFetch.mockResolvedValue({ _id: '10', _type: 'product' });
      await repo.create({ name: 'New' }, { fields: ['name'] });
      expect(mockFetch).toHaveBeenCalledWith('/products', {
        method: 'POST',
        body: { name: 'New' },
        query: { fields: 'name' },
      });
    });

    it('propagates errors from create', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'));
      await expect(repo.create({ name: '' })).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('update', () => {
    it('sends PATCH request with id and data', async () => {
      const payload = { name: 'Updated' };
      mockFetch.mockResolvedValue({
        _id: '1',
        _type: 'product',
        ...payload,
      });
      await repo.update('1', payload);
      expect(mockFetch).toHaveBeenCalledWith('/products/1', {
        method: 'PATCH',
        body: payload,
        query: undefined,
      });
    });

    it('returns the updated entity', async () => {
      const updated = { _id: '1', _type: 'product', name: 'Updated' };
      mockFetch.mockResolvedValue(updated);
      const result = await repo.update('1', { name: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('passes field selection as query', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
      await repo.update('1', { name: 'X' }, { fields: ['name', 'price'] });
      expect(mockFetch).toHaveBeenCalledWith('/products/1', {
        method: 'PATCH',
        body: { name: 'X' },
        query: { fields: 'name,price' },
      });
    });

    it('propagates errors from update', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'));
      await expect(repo.update('999', { name: 'X' })).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE request with id', async () => {
      mockFetch.mockResolvedValue(null);
      await repo.delete('1');
      expect(mockFetch).toHaveBeenCalledWith('/products/1', {
        method: 'DELETE',
      });
    });

    it('returns void on success', async () => {
      mockFetch.mockResolvedValue(null);
      const result = await repo.delete('1');
      expect(result).toBeUndefined();
    });

    it('propagates errors from delete', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'));
      await expect(repo.delete('1')).rejects.toThrow('Forbidden');
    });
  });
});
