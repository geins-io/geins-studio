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
    it('list POSTs the no-pagination batch to /asset/query and unwraps items', async () => {
      const items = [{ _id: 'a1', _type: 'geins.asset' }];
      mockFetch.mockResolvedValue({ items });
      await expect(api.list()).resolves.toEqual(items);
      expect(mockFetch).toHaveBeenCalledWith('/asset/query', {
        method: 'POST',
        body: { all: true, page: 1, pageSize: 10000000 },
      });
    });

    it('list scopes to a folder via the query body (search stays client-side)', async () => {
      mockFetch.mockResolvedValue({ items: [] });
      await api.list({ folderId: 'f1', search: 'logo' });
      expect(mockFetch).toHaveBeenCalledWith('/asset/query', {
        method: 'POST',
        body: { all: true, page: 1, pageSize: 10000000, folderId: 'f1' },
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

    it('upload POSTs the form data to /asset/upload', async () => {
      const form = new FormData();
      form.append('file', new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
      mockFetch.mockResolvedValue([]);
      await api.upload(form);
      expect(mockFetch).toHaveBeenCalledWith('/asset/upload', {
        method: 'POST',
        body: form,
        errorContext: { action: 'creating', entity: 'asset' },
      });
    });

    it('replace POSTs the form data to /asset/:id/replace', async () => {
      const form = new FormData();
      form.append('file', new File(['x'], 'b.jpg', { type: 'image/jpeg' }));
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.replace('1', form);
      expect(mockFetch).toHaveBeenCalledWith('/asset/1/replace', {
        method: 'POST',
        body: form,
        errorContext: { action: 'updating', entity: 'asset' },
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
      const body = { name: 'Marketing', parentFolderId: null, sortOrder: 0 };
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

    it('deleteFolder defaults to moving assets to uncategorised', async () => {
      mockFetch.mockResolvedValue(null);
      await api.deleteFolder('f');
      expect(mockFetch).toHaveBeenCalledWith('/asset/folder/f', {
        method: 'DELETE',
        query: { assets: 'move' },
        errorContext: { action: 'deleting', entity: 'folder' },
      });
    });

    it('deleteFolder forwards the delete disposition', async () => {
      mockFetch.mockResolvedValue(null);
      await api.deleteFolder('f', 'delete');
      expect(mockFetch).toHaveBeenCalledWith('/asset/folder/f', {
        method: 'DELETE',
        query: { assets: 'delete' },
        errorContext: { action: 'deleting', entity: 'folder' },
      });
    });
  });
});
