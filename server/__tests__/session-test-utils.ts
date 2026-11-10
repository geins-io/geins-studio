import { createApp, toWebHandler, type EventHandler } from 'h3';

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

/** An unsigned JWT with these claims; the session only decodes tokens. */
export const fakeJwt = (claims: Record<string, unknown>) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;

export const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Runs h3 handlers like the server does, and keeps the cookies between calls. */
export function createTestServer(routes: Record<string, EventHandler>) {
  const app = createApp({
    onError: (error) => {
      if (process.env.DEBUG_H3) console.error(error);
    },
  });
  for (const [path, handler] of Object.entries(routes)) {
    app.use(path, handler);
  }
  const handle = toWebHandler(app);
  const jar = new Map<string, string>();

  const request = async (
    path: string,
    init: {
      method?: string;
      body?: unknown;
      cookies?: Record<string, string>;
    } = {},
  ) => {
    const cookies = init.cookies ?? Object.fromEntries(jar);
    const headers = new Headers({ 'content-type': 'application/json' });
    const cookie = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    if (cookie) headers.set('cookie', cookie);
    const response = await handle(
      new Request(`http://studio.test${path}`, {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      }),
    );
    const setCookies = response.headers.getSetCookie();
    for (const line of setCookies) {
      const [pair] = line.split(';');
      const [name, ...rest] = (pair ?? '').split('=');
      const value = rest.join('=');
      if (!name) continue;
      if (!value || /max-age=0/i.test(line)) jar.delete(name);
      else jar.set(name, value);
    }
    const text = await response.text();
    return {
      status: response.status,
      setCookies,
      body: text ? JSON.parse(text) : undefined,
    };
  };

  return { request, jar };
}
