// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetRepo } from '../asset';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

describe('assetRepo', () => {
  const api = assetRepo(mockFetch);

  describe('assets → /asset', () => {
    it('list calls GET /asset/list', async () => {
      mockFetch.mockResolvedValue([]);
      await api.list();
      expect(mockFetch).toHaveBeenCalledWith('/asset/list', {
        query: undefined,
      });
    });

    it('list forwards folder + search query options', async () => {
      mockFetch.mockResolvedValue([]);
      await api.list({ folderId: 'f1', search: 'logo' });
      expect(mockFetch).toHaveBeenCalledWith('/asset/list', {
        query: { folderId: 'f1', search: 'logo' },
      });
    });

    it('get calls GET /asset/:id', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.get('1');
      expect(mockFetch).toHaveBeenCalledWith('/asset/1', { query: undefined });
    });

    it('create POSTs to /asset with asset errorContext', async () => {
      const body = {
        name: 'hero.jpg',
        type: 'image' as const,
        folderId: null,
        tags: [],
        channels: [],
      };
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset', ...body });
      await api.create(body);
      expect(mockFetch).toHaveBeenCalledWith('/asset', {
        method: 'POST',
        body,
        query: undefined,
        errorContext: { action: 'creating', entity: 'asset' },
      });
    });

    it('update PATCHes /asset/:id with asset errorContext', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.update('1', { name: 'renamed.jpg' });
      expect(mockFetch).toHaveBeenCalledWith('/asset/1', {
        method: 'PATCH',
        body: { name: 'renamed.jpg' },
        query: undefined,
        errorContext: { action: 'updating', entity: 'asset' },
      });
    });

    it('delete DELETEs /asset/:id with asset errorContext', async () => {
      mockFetch.mockResolvedValue(null);
      await api.delete('1');
      expect(mockFetch).toHaveBeenCalledWith('/asset/1', {
        method: 'DELETE',
        errorContext: { action: 'deleting', entity: 'asset' },
      });
    });
  });

  describe('folder sub-repo → /asset/folder', () => {
    it('folder.list calls GET /asset/folder/list', async () => {
      mockFetch.mockResolvedValue([]);
      await api.folder.list();
      expect(mockFetch).toHaveBeenCalledWith('/asset/folder/list', {
        query: undefined,
      });
    });

    it('folder.create POSTs to /asset/folder with folder errorContext', async () => {
      const body = { name: 'Marketing', parentId: null, sortOrder: 0 };
      mockFetch.mockResolvedValue({ _id: 'f', _type: 'folder', ...body });
      await api.folder.create(body);
      expect(mockFetch).toHaveBeenCalledWith('/asset/folder', {
        method: 'POST',
        body,
        query: undefined,
        errorContext: { action: 'creating', entity: 'folder' },
      });
    });

    it('folder.delete DELETEs /asset/folder/:id', async () => {
      mockFetch.mockResolvedValue(null);
      await api.folder.delete('f');
      expect(mockFetch).toHaveBeenCalledWith('/asset/folder/f', {
        method: 'DELETE',
        errorContext: { action: 'deleting', entity: 'folder' },
      });
    });
  });
});
