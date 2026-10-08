// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { assetRepo } from '../asset';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

// Per-test `vi.stubGlobal('fetch')` must not leak when an assertion fails first.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('assetRepo', () => {
  const api = assetRepo(mockFetch);

  describe('assets → /media/assets', () => {
    const page = { page: 1, pageSize: 1000 };

    it('list POSTs the match-all batch to /media/assets/query and unwraps items', async () => {
      const items = [{ _id: 'a1', _type: 'geins.asset' }];
      mockFetch.mockResolvedValue({ _id: 'b1', pageCount: 1, items });
      await expect(api.list()).resolves.toEqual(items);
      // No filters = the "all assets" view, the only case `all: true` is sent.
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
        method: 'POST',
        body: { all: true, ...page },
      });
    });

    it('list scopes to a folder subtree without all (search stays client-side)', async () => {
      mockFetch.mockResolvedValue({ _id: 'b1', pageCount: 1, items: [] });
      await api.list({ folderId: 'f1', search: 'logo' });
      // `all: true` would override `folderIds`, so it must not ride along.
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
        method: 'POST',
        body: { folderIds: ['f1'], includeSubfolders: true, ...page },
      });
    });

    it('list scopes to the library root via a null folderIds entry', async () => {
      mockFetch.mockResolvedValue({ _id: 'b1', pageCount: 1, items: [] });
      await api.list({ folderId: null });
      // `folderId: null` (Uncategorised) must not collapse into "no filter", and
      // is root-level only — no `includeSubfolders`.
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
        method: 'POST',
        body: { folderIds: [null], ...page },
      });
    });

    it('list asks for the trashed set without all', async () => {
      mockFetch.mockResolvedValue({ _id: 'b1', pageCount: 1, items: [] });
      await api.list({ trashed: true });
      // Either-or: `trashed: true` replaces the live set, so it rides alone.
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
        method: 'POST',
        body: { trashed: true, ...page },
      });
    });

    it('byIds POSTs assetIds without all and sizes the page to the ids', async () => {
      const items = [{ _id: 'a1', _type: 'geins.asset' }];
      mockFetch.mockResolvedValue({ _id: 'b1', pageCount: 1, items });
      await expect(api.byIds(['a1', 'a2'])).resolves.toEqual(items);
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
        method: 'POST',
        body: { assetIds: ['a1', 'a2'], page: 1, pageSize: 2 },
      });
    });

    it('byIds skips the request when there are no ids', async () => {
      await expect(api.byIds([])).resolves.toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    describe('query', () => {
      const state = {
        page: 1,
        pageSize: 50,
        sort: null,
        search: '',
        filters: {},
      };
      const result = {
        _id: 'b1',
        page: 1,
        pageSize: 50,
        totalItemCount: 0,
        pageCount: 0,
        items: [],
      };
      const lastBody = () => mockFetch.mock.calls.at(-1)[1].body;

      beforeEach(() => mockFetch.mockResolvedValue(result));

      it('POSTs to /media/assets/query without the error toast and returns the full batch', async () => {
        await expect(api.query(state)).resolves.toEqual(result);
        expect(mockFetch).toHaveBeenCalledWith('/media/assets/query', {
          method: 'POST',
          body: { all: true, page: 1, pageSize: 50 },
          suppressErrorToast: true,
        });
      });

      it('omits search when empty or whitespace', async () => {
        await api.query({ ...state, search: '   ' });
        expect(lastBody()).not.toHaveProperty('search');
        await api.query({ ...state, search: ' logo ' });
        expect(lastBody()).toMatchObject({ search: 'logo' });
      });

      it('omits sortBy / sortDirection when sort is null', async () => {
        await api.query(state);
        expect(lastBody()).not.toHaveProperty('sortBy');
        expect(lastBody()).not.toHaveProperty('sortDirection');
      });

      it('maps the sort column to sortBy and drops unknown columns', async () => {
        await api.query({
          ...state,
          sort: { field: 'name', direction: 'asc' },
        });
        expect(lastBody()).toMatchObject({
          sortBy: 'name',
          sortDirection: 'asc',
        });
        await api.query({
          ...state,
          sort: { field: 'thumbnail', direction: 'asc' },
        });
        expect(lastBody()).not.toHaveProperty('sortBy');
      });

      it('never combines all with a filter, search or scope', async () => {
        await api.query({ ...state, filters: { assetTypes: ['image'] } });
        expect(lastBody()).toEqual({
          assetTypes: ['image'],
          page: 1,
          pageSize: 50,
        });
        await api.query({ ...state, search: 'logo' });
        expect(lastBody()).not.toHaveProperty('all');
        await api.query(state, { folderId: 'f1' });
        expect(lastBody()).toEqual({
          folderIds: ['f1'],
          includeSubfolders: true,
          page: 1,
          pageSize: 50,
        });
        await api.query(state, { trashed: true });
        expect(lastBody()).toEqual({ trashed: true, page: 1, pageSize: 50 });
      });

      it('keeps all when filters are empty', async () => {
        await api.query({
          ...state,
          filters: { assetTypes: [], channels: [], createdBy: '' },
        });
        expect(lastBody()).toEqual({ all: true, page: 1, pageSize: 50 });
      });

      it('passes the batch id through as _id', async () => {
        await api.query({ ...state, page: 3 }, undefined, { batchId: 'b1' });
        expect(lastBody()).toMatchObject({ _id: 'b1', page: 3 });
        await api.query(state);
        expect(lastBody()).not.toHaveProperty('_id');
      });

      it('clamps pageSize to the 1000 cap', async () => {
        await api.query({ ...state, pageSize: 5000 });
        expect(lastBody()).toMatchObject({ pageSize: 1000 });
        await api.query({ ...state, pageSize: 0, page: 0 });
        expect(lastBody()).toMatchObject({ pageSize: 1, page: 1 });
      });

      it('forwards the abort signal', async () => {
        const { signal } = new AbortController();
        await api.query(state, undefined, { signal });
        expect(mockFetch.mock.calls.at(-1)[1].signal).toBe(signal);
      });
    });

    it('get calls GET /media/assets/:id', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.get('1');
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/1', {
        query: undefined,
      });
    });

    it('create POSTs to /media/assets with asset errorContext', async () => {
      const body = {
        name: 'hero.jpg',
        type: 'image' as const,
        folderId: null,
        tags: [],
        channels: [],
      };
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset', ...body });
      await api.create(body);
      expect(mockFetch).toHaveBeenCalledWith('/media/assets', {
        method: 'POST',
        body,
        query: undefined,
        errorContext: { action: 'creating', entity: 'asset' },
      });
    });

    it('update PATCHes /media/assets/:id with asset errorContext', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.update('1', { name: 'renamed.jpg' });
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/1', {
        method: 'PATCH',
        body: { name: 'renamed.jpg' },
        query: undefined,
        errorContext: { action: 'updating', entity: 'asset' },
      });
    });

    it('delete DELETEs /media/assets/:id with asset errorContext', async () => {
      mockFetch.mockResolvedValue(null);
      await api.delete('1');
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/1', {
        method: 'DELETE',
        errorContext: { action: 'deleting', entity: 'asset' },
      });
    });

    it('relocate POSTs name + folder to /media/assets/:id/relocate', async () => {
      mockFetch.mockResolvedValue({ _id: '1', _type: 'asset' });
      await api.relocate('1', { name: 'renamed.jpg', folderId: 'f1' });
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/1/relocate', {
        method: 'POST',
        body: { name: 'renamed.jpg', folderId: 'f1' },
        errorContext: { action: 'updating', entity: 'asset' },
      });
    });

    describe('matchingAssets', () => {
      const state = {
        page: 3,
        pageSize: 24,
        sort: null,
        search: 'logo',
        filters: {},
      };
      const batch = (page: number, pageCount: number, ids: string[]) => ({
        _id: 'b1',
        page,
        pageSize: 1000,
        totalItemCount: 0,
        pageCount,
        items: ids.map((_id) => ({ _id, type: 'image', name: _id })),
      });

      it('pages the same batch at the cap and collects every asset', async () => {
        mockFetch
          .mockResolvedValueOnce(batch(1, 2, ['a1', 'a2']))
          .mockResolvedValueOnce(batch(2, 2, ['a3']));
        await expect(
          api.matchingAssets(state, { folderId: 'f1' }),
        ).resolves.toEqual([
          { _id: 'a1', type: 'image', name: 'a1' },
          { _id: 'a2', type: 'image', name: 'a2' },
          { _id: 'a3', type: 'image', name: 'a3' },
        ]);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        // The list's own page / pageSize are replaced; scope + search kept.
        expect(mockFetch.mock.calls[0][1]).toEqual({
          method: 'POST',
          body: {
            folderIds: ['f1'],
            includeSubfolders: true,
            search: 'logo',
            page: 1,
            pageSize: 1000,
          },
          suppressErrorToast: true,
        });
        expect(mockFetch.mock.calls[1][1].body).toMatchObject({
          _id: 'b1',
          page: 2,
        });
      });

      it('stops on an empty page', async () => {
        mockFetch.mockResolvedValueOnce(batch(1, 5, []));
        await expect(api.matchingAssets(state)).resolves.toEqual([]);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('bulkDelete POSTs the ids to /media/assets/bulk-delete', async () => {
      mockFetch.mockResolvedValue(null);
      await api.bulkDelete(['a1', 'a2'], { suppressErrorToast: true });
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/bulk-delete', {
        method: 'POST',
        body: { assetIds: ['a1', 'a2'] },
        errorContext: { action: 'deleting', entity: 'asset' },
        suppressErrorToast: true,
      });
    });

    it('bulkPurge POSTs the ids to /media/assets/bulk-purge', async () => {
      mockFetch.mockResolvedValue({ assetCount: 2 });
      const result = await api.bulkPurge(['a1', 'a2'], {
        suppressErrorToast: true,
      });
      expect(result).toEqual({ assetCount: 2 });
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/bulk-purge', {
        method: 'POST',
        body: { assetIds: ['a1', 'a2'] },
        errorContext: { action: 'deleting', entity: 'asset' },
        suppressErrorToast: true,
      });
    });

    it('emptyTrash POSTs with no body to /media/trash/empty', async () => {
      mockFetch.mockResolvedValue({ assetCount: 3 });
      const result = await api.emptyTrash();
      expect(result).toEqual({ assetCount: 3 });
      expect(mockFetch).toHaveBeenCalledWith('/media/trash/empty', {
        method: 'POST',
        errorContext: { action: 'deleting', entity: 'asset' },
      });
    });

    it('bulkTag POSTs the ids and tags to /media/assets/bulk-tag', async () => {
      mockFetch.mockResolvedValue(null);
      await api.bulkTag(['a1', 'a2'], ['hero'], { suppressErrorToast: true });
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/bulk-tag', {
        method: 'POST',
        body: { assetIds: ['a1', 'a2'], tags: ['hero'] },
        errorContext: { action: 'updating', entity: 'asset' },
        suppressErrorToast: true,
      });
    });

    it('bulkLink POSTs the ids and links to /media/assets/bulk-link', async () => {
      mockFetch.mockResolvedValue(null);
      const links = [{ targetType: 'productfile' as const, targetId: 'p1' }];
      await api.bulkLink(['a1'], links);
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/bulk-link', {
        method: 'POST',
        body: { assetIds: ['a1'], links },
        errorContext: { action: 'updating', entity: 'asset' },
      });
    });

    it('removeLink DELETEs the link by type and target', async () => {
      mockFetch.mockResolvedValue(null);
      await api.removeLink('a1', 'productimage', '033126');
      expect(mockFetch).toHaveBeenCalledWith(
        '/media/assets/a1/links/productimage/033126',
        {
          method: 'DELETE',
          errorContext: { action: 'updating', entity: 'asset' },
        },
      );
    });

    it('bulkAssignChannels POSTs the ids and channels', async () => {
      mockFetch.mockResolvedValue(null);
      await api.bulkAssignChannels(['a1'], ['1|se']);
      expect(mockFetch).toHaveBeenCalledWith(
        '/media/assets/bulk-assign-channels',
        {
          method: 'POST',
          body: { assetIds: ['a1'], channels: ['1|se'] },
          errorContext: { action: 'updating', entity: 'asset' },
        },
      );
    });

    describe('bulkMove', () => {
      it('POSTs the ids and folder and returns the move on 202', async () => {
        mockFetch.mockResolvedValue({ moveId: 'm1' });
        await expect(
          api.bulkMove(['a1'], 'f1', { suppressErrorToast: true }),
        ).resolves.toEqual({ moveId: 'm1' });
        expect(mockFetch).toHaveBeenCalledWith('/media/assets/bulk-move', {
          method: 'POST',
          body: { assetIds: ['a1'], folderId: 'f1' },
          errorContext: { action: 'updating', entity: 'asset' },
          suppressErrorToast: true,
        });
      });

      it('sends an explicit null folderId for the library root', async () => {
        mockFetch.mockResolvedValue({ moveId: 'm1' });
        await api.bulkMove(['a1'], null);
        expect(mockFetch.mock.calls[0][1].body).toEqual({
          assetIds: ['a1'],
          folderId: null,
        });
      });

      it('returns null on 204 (already in the folder)', async () => {
        mockFetch.mockResolvedValue(undefined);
        await expect(api.bulkMove(['a1'], 'f1')).resolves.toBeNull();
      });
    });

    it('restore POSTs to /media/assets/:id/restore', async () => {
      mockFetch.mockResolvedValue(null);
      await api.restore('1');
      expect(mockFetch).toHaveBeenCalledWith('/media/assets/1/restore', {
        method: 'POST',
        errorContext: { action: 'updating', entity: 'asset' },
      });
    });

    describe('trashedAtPaths', () => {
      it('queries the trash per folder + name and matches the name exactly', async () => {
        mockFetch
          .mockResolvedValueOnce({
            _id: 'b1',
            pageCount: 1,
            // `assetName` is a substring match — only the exact name counts.
            items: [
              { _id: 'a0', name: 'old_hero.jpg' },
              { _id: 'a1', name: 'Hero.JPG' },
            ],
          })
          .mockResolvedValueOnce({ _id: 'b2', pageCount: 1, items: [] });

        const found = await api.trashedAtPaths(
          [
            { folderId: 'f1', name: 'hero.jpg' },
            { folderId: null, name: 'logo.svg' },
          ],
          { suppressErrorToast: true },
        );

        expect(found.map((a) => a?._id ?? null)).toEqual(['a1', null]);
        expect(mockFetch).toHaveBeenNthCalledWith(1, '/media/assets/query', {
          method: 'POST',
          body: {
            trashed: true,
            folderIds: ['f1'],
            assetName: 'hero.jpg',
            page: 1,
            pageSize: 1000,
          },
          suppressErrorToast: true,
        });
        // The library root is a null folderIds entry, not "every folder".
        expect(mockFetch.mock.calls[1][1].body.folderIds).toEqual([null]);
      });
    });
  });

  describe('replace → /media/assets/:id/replace', () => {
    const ticket = (result: object) => ({
      ticketId: 't1',
      expiresAt: 'x',
      results: [result],
    });

    it('claims a replace ticket with a JSON body, PUTs the bytes, completes', async () => {
      const put = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', put);
      mockFetch
        .mockResolvedValueOnce(
          ticket({
            clientRef: '1',
            status: 'accepted',
            assetId: '1',
            upload: { mode: 'single', url: 'https://blob/1' },
          }),
        )
        .mockResolvedValueOnce({
          results: [
            { clientRef: '1', status: 'completed', file: { _id: '1' } },
          ],
        });

      const file = new File(['xy'], 'b.jpg', { type: 'image/jpeg' });
      const out = await api.replace('1', file);

      expect(mockFetch).toHaveBeenNthCalledWith(1, '/media/assets/1/replace', {
        method: 'POST',
        body: { fileName: 'b.jpg', sizeBytes: 2, mimeType: 'image/jpeg' },
        errorContext: { action: 'updating', entity: 'asset' },
      });
      expect(put).toHaveBeenCalledWith(
        'https://blob/1',
        expect.objectContaining({
          method: 'PUT',
          body: file,
          headers: {
            'content-type': 'image/jpeg',
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-blob-content-type': 'image/jpeg',
          },
        }),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/media/tickets/t1/complete',
        {
          method: 'POST',
          body: { files: ['1'] },
          errorContext: { action: 'updating', entity: 'asset' },
        },
      );
      expect(out).toEqual({
        clientRef: '1',
        status: 'completed',
        file: { _id: '1' },
      });
      vi.unstubAllGlobals();
    });

    it('returns a completion rejection and forwards fetch options', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      mockFetch
        .mockResolvedValueOnce(
          ticket({
            clientRef: '1',
            status: 'accepted',
            assetId: '1',
            upload: { mode: 'single', url: 'https://blob/1' },
          }),
        )
        .mockResolvedValueOnce({
          results: [
            {
              clientRef: '1',
              status: 'rejected',
              code: 'FILE_TYPE_NOT_ALLOWED',
              message: 'nope',
            },
          ],
        });

      const out = await api.replace(
        '1',
        new File(['x'], 'b.jpg', { type: 'image/jpeg' }),
        { suppressErrorToast: true },
      );

      expect(out).toMatchObject({
        status: 'rejected',
        code: 'FILE_TYPE_NOT_ALLOWED',
      });
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/media/assets/1/replace',
        expect.objectContaining({ suppressErrorToast: true }),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/media/tickets/t1/complete',
        expect.objectContaining({ suppressErrorToast: true }),
      );
      vi.unstubAllGlobals();
    });

    it('returns a ticket-stage rejection without uploading or completing', async () => {
      const put = vi.fn();
      vi.stubGlobal('fetch', put);
      mockFetch.mockResolvedValueOnce(
        ticket({
          clientRef: '1',
          status: 'rejected',
          code: 'FILE_TOO_LARGE',
          message: 'too big',
        }),
      );

      const out = await api.replace(
        '1',
        new File(['x'], 'b.jpg', { type: 'image/jpeg' }),
      );

      expect(out).toEqual({
        clientRef: '1',
        status: 'rejected',
        code: 'FILE_TOO_LARGE',
        message: 'too big',
      });
      expect(put).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('lets a refused claim (404 / 409 / 422) throw before any upload', async () => {
      const put = vi.fn();
      vi.stubGlobal('fetch', put);
      mockFetch.mockRejectedValueOnce({ status: 422 });

      await expect(
        api.replace('1', new File(['x'], 'b.png', { type: 'image/png' })),
      ).rejects.toEqual({ status: 422 });
      expect(put).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    });
  });

  describe('folder sub-repo → /media/folders', () => {
    it('folder.list reads the collection root, not /list', async () => {
      mockFetch.mockResolvedValue([]);
      await api.folder.list();
      expect(mockFetch).toHaveBeenCalledWith('/media/folders', {
        query: undefined,
      });
    });

    it('folder.create POSTs to /media/folders with folder errorContext', async () => {
      const body = { name: 'Marketing', parentFolderId: null };
      mockFetch.mockResolvedValue({ _id: 'f', _type: 'folder', ...body });
      await api.folder.create(body);
      expect(mockFetch).toHaveBeenCalledWith('/media/folders', {
        method: 'POST',
        body,
        query: undefined,
        errorContext: { action: 'creating', entity: 'folder' },
      });
    });

    it('folder.delete DELETEs /media/folders/:id', async () => {
      mockFetch.mockResolvedValue(null);
      await api.folder.delete('f');
      expect(mockFetch).toHaveBeenCalledWith('/media/folders/f', {
        method: 'DELETE',
        errorContext: { action: 'deleting', entity: 'folder' },
      });
    });

    it('deleteFolder sends the action and returns the deletion counts', async () => {
      mockFetch.mockResolvedValue({ folderCount: 2, assetCount: 5 });
      const result = await api.deleteFolder('f', 'trash');
      expect(result).toEqual({ folderCount: 2, assetCount: 5 });
      expect(mockFetch).toHaveBeenCalledWith('/media/folders/f', {
        method: 'DELETE',
        query: { action: 'trash' },
        errorContext: { action: 'deleting', entity: 'folder' },
      });
    });

    it('deleteFolder forwards fetch options', async () => {
      mockFetch.mockResolvedValue({ folderCount: 1, assetCount: 0 });
      await api.deleteFolder('f', 'purge', { suppressErrorToast: true });
      expect(mockFetch).toHaveBeenCalledWith('/media/folders/f', {
        method: 'DELETE',
        query: { action: 'purge' },
        errorContext: { action: 'deleting', entity: 'folder' },
        suppressErrorToast: true,
      });
    });
  });

  describe('uploadViaTickets → /media/tickets', () => {
    it('claims a ticket, PUTs accepted bytes, completes, and merges outcomes', async () => {
      const put = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', put);
      mockFetch
        .mockResolvedValueOnce({
          ticketId: 't1',
          expiresAt: 'x',
          results: [
            {
              clientRef: 'a',
              status: 'accepted',
              assetId: 'id-a',
              upload: { mode: 'single', url: '/api/media/tickets/t1/blob/a' },
            },
            {
              clientRef: 'b',
              status: 'rejected',
              code: 'FILE_TOO_LARGE',
              message: 'too big',
            },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            { clientRef: 'a', status: 'completed', file: { _id: 'id-a' } },
          ],
        });

      const fileA = new File(['x'], 'a.png', { type: 'image/png' });
      const fileB = new File(['yy'], 'b.png', { type: 'image/png' });
      const out = await api.uploadViaTickets([
        { file: fileA, clientRef: 'a' },
        { file: fileB, clientRef: 'b' },
      ]);

      // Step 1: ticket claim.
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/media/tickets',
        expect.objectContaining({ method: 'POST' }),
      );
      // Step 2: PUT only the accepted file, with the Azure blob headers.
      expect(put).toHaveBeenCalledTimes(1);
      expect(put).toHaveBeenCalledWith(
        '/api/media/tickets/t1/blob/a',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'content-type': 'image/png',
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-blob-content-type': 'image/png',
          },
        }),
      );
      // Step 3: complete with the accepted refs only.
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/media/tickets/t1/complete',
        expect.objectContaining({ method: 'POST', body: { files: ['a'] } }),
      );
      // Merged: completed 'a' + ticket-stage rejection 'b'.
      expect(out).toEqual([
        { clientRef: 'a', status: 'completed', file: { _id: 'id-a' } },
        {
          clientRef: 'b',
          status: 'rejected',
          code: 'FILE_TOO_LARGE',
          message: 'too big',
        },
      ]);
      vi.unstubAllGlobals();
    });

    it('forwards claim metadata + links, and omits folderId in path mode', async () => {
      const put = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', put);
      mockFetch
        .mockResolvedValueOnce({ ticketId: 't1', expiresAt: 'x', results: [] })
        .mockResolvedValueOnce({ results: [] });

      await api.uploadViaTickets([
        {
          file: new File(['x'], 'a.png', { type: 'image/png' }),
          clientRef: 'a',
          folderId: null,
          localizations: { en: { altText: 'Logo' } },
          links: [{ targetType: 'productimage', targetId: 'p1' }],
        },
        {
          // No folderId at all → path mode: the backend creates `campaigns`.
          file: new File(['x'], 'hero.png', { type: 'image/png' }),
          clientRef: 'b',
          name: 'campaigns/hero.png',
        },
      ]);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/media/tickets',
        expect.objectContaining({
          body: {
            files: [
              {
                clientRef: 'a',
                folderId: null,
                name: 'a.png',
                sizeBytes: 1,
                mimeType: 'image/png',
                overwrite: false,
                localizations: { en: { altText: 'Logo' } },
                links: [{ targetType: 'productimage', targetId: 'p1' }],
              },
              {
                clientRef: 'b',
                name: 'campaigns/hero.png',
                sizeBytes: 1,
                mimeType: 'image/png',
                overwrite: false,
              },
            ],
          },
        }),
      );
      vi.unstubAllGlobals();
    });

    it('chunks over the per-ticket file cap into separate ticket claims', async () => {
      const put = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', put);
      // 51 files > MAX_FILES_PER_TICKET (50) → two ticket claims + two completes.
      const files = Array.from(
        { length: 51 },
        (_, i) => new File(['x'], `f${i}.png`, { type: 'image/png' }),
      );
      // Each ticket claim accepts whatever it was sent; each complete echoes them.
      mockFetch.mockImplementation((url: string, opts: { body?: unknown }) => {
        if (url === '/media/tickets') {
          const body = opts.body as { files: { clientRef: string }[] };
          return Promise.resolve({
            ticketId: `t-${body.files.length}`,
            expiresAt: 'x',
            results: body.files.map((f) => ({
              clientRef: f.clientRef,
              status: 'accepted',
              assetId: `id-${f.clientRef}`,
              upload: { mode: 'single', url: `/blob/${f.clientRef}` },
            })),
          });
        }
        // complete
        const body = opts.body as { files: string[] };
        return Promise.resolve({
          results: body.files.map((clientRef) => ({
            clientRef,
            status: 'completed',
            file: { _id: `id-${clientRef}` },
          })),
        });
      });

      const out = await api.uploadViaTickets(
        files.map((file, i) => ({ file, clientRef: String(i) })),
      );

      const ticketClaims = mockFetch.mock.calls.filter(
        (c: unknown[]) => c[0] === '/media/tickets',
      );
      expect(ticketClaims).toHaveLength(2); // 50 + 1
      expect(put).toHaveBeenCalledTimes(51);
      expect(out.filter((r) => r.status === 'completed')).toHaveLength(51);
      vi.unstubAllGlobals();
    });

    it('rejects an over-1 GB file client-side without claiming a ticket', async () => {
      const put = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', put);
      const big = new File(['x'], 'big.png', { type: 'image/png' });
      // Force the size past the 1 GB cap without allocating real bytes.
      Object.defineProperty(big, 'size', { value: 2 * 1024 ** 3 });

      const out = await api.uploadViaTickets([{ file: big, clientRef: 'big' }]);

      // No ticket claimed, no bytes PUT — just the client-side rejection.
      expect(mockFetch).not.toHaveBeenCalled();
      expect(put).not.toHaveBeenCalled();
      expect(out).toEqual([
        {
          clientRef: 'big',
          status: 'rejected',
          code: 'FILE_TOO_LARGE',
          message: 'File exceeds the 1 GB limit.',
        },
      ]);
      vi.unstubAllGlobals();
    });

    it('throws on an unknown upload mode (server ahead of client)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      mockFetch.mockResolvedValueOnce({
        ticketId: 't',
        expiresAt: 'x',
        results: [
          {
            clientRef: 'a',
            status: 'accepted',
            assetId: 'id',
            upload: { mode: 'parts', url: '/x' },
          },
        ],
      });
      const file = new File(['x'], 'a.png', { type: 'image/png' });
      await expect(
        api.uploadViaTickets([{ file, clientRef: 'a' }]),
      ).rejects.toThrow(/Unsupported upload mode/);
      vi.unstubAllGlobals();
    });
  });
});
