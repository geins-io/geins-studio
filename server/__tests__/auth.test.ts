// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError } from '#shared/utils/auth-session';

vi.mock('nitropack/runtime', () => ({
  useRuntimeConfig: () => ({
    public: { apiUrl: 'https://geins.test/v2', appId: 'studio' },
  }),
}));
vi.mock('#shared/utils/log', () => ({ log: () => ({ geinsLog: vi.fn() }) }));
const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

const { auth } = await import('../utils/auth');

beforeEach(() => {
  fetchMock.mockReset();
});

describe('auth().revoke', () => {
  it('posts the refresh token to auth/revoke and accepts an empty 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(auth().revoke('refresh-1')).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://geins.test/v2/auth/revoke');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([400, 404, 500, 503])(
    'throws the status Geins answers (%i)',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ title: 'Revoke failed.' }), { status }),
      );
      const error = await auth()
        .revoke('refresh-1')
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AuthApiError);
      expect((error as AuthApiError).status).toBe(status);
      expect((error as AuthApiError).message).not.toContain('refresh-1');
    },
  );

  it('throws status 0 on a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const error = await auth()
      .revoke('refresh-1')
      .catch((e: unknown) => e);
    expect((error as AuthApiError).status).toBe(0);
  });
});
