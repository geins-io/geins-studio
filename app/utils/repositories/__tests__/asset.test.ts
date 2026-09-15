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
    it('list POSTs the fetch-all batch to /asset/query and unwraps items', async () => {
      const items = [{ _id: 'a1', _type: 'geins.asset' }];
      mockFetch.mockResolvedValue({ items });
      await expect(api.list()).resolves.toEqual(items);
      // `all: true` is the fetch-all switch; no folderIds = every folder.
      expect(mockFetch).toHaveBeenCalledWith('/asset/query', {
        method: 'POST',
        body: { all: true },
      });
    });

    it('list scopes to a folder via folderIds (search stays client-side)', async () => {
      mockFetch.mockResolvedValue({ items: [] });
      await api.list({ folderId: 'f1', search: 'logo' });
      expect(mockFetch).toHaveBeenCalledWith('/asset/query', {
        method: 'POST',
        body: { all: true, folderIds: ['f1'] },
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

  describe('uploadViaTickets → /asset/tickets', () => {
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
              upload: { mode: 'single', url: '/api/asset/tickets/t1/blob/a' },
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
        '/asset/tickets',
        expect.objectContaining({ method: 'POST' }),
      );
      // Step 2: PUT only the accepted file, with the Azure blob headers.
      expect(put).toHaveBeenCalledTimes(1);
      expect(put).toHaveBeenCalledWith(
        '/api/asset/tickets/t1/blob/a',
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
        '/asset/tickets/t1/complete',
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
        if (url === '/asset/tickets') {
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
        (c: unknown[]) => c[0] === '/asset/tickets',
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
