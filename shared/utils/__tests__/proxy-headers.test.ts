// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  IF_MATCH_PROXY_HEADER,
  pickUpstreamHeaders,
  restoreIfMatch,
  tunnelIfMatch,
} from '../proxy-headers';

describe('tunnelIfMatch', () => {
  it('moves If-Match to the proxy header', () => {
    const headers = new Headers({ 'If-Match': '"e1"', 'x-app': 'geins' });
    tunnelIfMatch(headers);
    expect(headers.has('if-match')).toBe(false);
    expect(headers.get(IF_MATCH_PROXY_HEADER)).toBe('"e1"');
    expect(headers.get('x-app')).toBe('geins');
  });

  it('leaves headers without If-Match untouched', () => {
    const headers = new Headers({ 'x-app': 'geins' });
    tunnelIfMatch(headers);
    expect([...headers.keys()]).toEqual(['x-app']);
  });

  it('is idempotent, so a retried request keeps the tunnelled value', () => {
    const headers = new Headers({ 'If-Match': '"e1"' });
    tunnelIfMatch(headers);
    tunnelIfMatch(headers);
    expect(headers.get(IF_MATCH_PROXY_HEADER)).toBe('"e1"');
    expect(headers.has('if-match')).toBe(false);
  });
});

describe('restoreIfMatch', () => {
  it('restores If-Match and drops the proxy header', () => {
    const headers: Record<string, string | undefined> = {
      [IF_MATCH_PROXY_HEADER]: '"e1"',
      'x-app': 'geins',
    };
    restoreIfMatch(headers);
    expect(headers).toEqual({ 'if-match': '"e1"', 'x-app': 'geins' });
  });

  it('leaves headers without the proxy header untouched', () => {
    const headers = { 'if-match': '"raw"', 'x-app': 'geins' };
    restoreIfMatch(headers);
    expect(headers).toEqual({ 'if-match': '"raw"', 'x-app': 'geins' });
  });

  it('round-trips the etag from browser headers to the upstream request', () => {
    const browser = new Headers({ 'If-Match': 'W/"abc"' });
    tunnelIfMatch(browser);
    const received = Object.fromEntries(browser.entries());
    restoreIfMatch(received);
    expect(received).toEqual({ 'if-match': 'W/"abc"' });
  });
});

describe('pickUpstreamHeaders', () => {
  const browser = {
    accept: 'application/json',
    'accept-language': 'sv-SE',
    'content-type': 'application/json',
    'idempotency-key': 'run-1',
    'x-account-key': 'acc-1',
    'x-app': 'geins',
    'x-access-token': 'tok-1',
    'x-custom': '1',
    cookie: '__Secure-next-auth.session-token=jwt; studio-pref=1',
    host: 'studio.geins.io',
    'x-forwarded-for': '203.0.113.7',
    'x-forwarded-host': 'studio.geins.io',
    'x-real-ip': '203.0.113.7',
    'x-vercel-id': 'arn1::abc',
    connection: 'keep-alive',
    'accept-encoding': 'gzip, br',
    'content-length': '42',
    'user-agent': 'Mozilla/5.0',
  };

  it('keeps the allowlisted headers and maps the token to authorization', () => {
    expect(pickUpstreamHeaders(browser)).toEqual({
      accept: 'application/json',
      'accept-language': 'sv-SE',
      'content-type': 'application/json',
      'idempotency-key': 'run-1',
      'x-account-key': 'acc-1',
      'x-app': 'geins',
      authorization: 'Bearer tok-1',
    });
  });

  it('never forwards the session cookie or host', () => {
    const upstream = pickUpstreamHeaders(browser);
    expect(upstream).not.toHaveProperty('cookie');
    expect(upstream).not.toHaveProperty('host');
  });

  it('drops content-length, so an empty DELETE never carries `0`', () => {
    const upstream = pickUpstreamHeaders({ 'content-length': '0' });
    expect(upstream).toEqual({});
  });

  it('ignores an inbound authorization header', () => {
    expect(pickUpstreamHeaders({ authorization: 'Bearer forged' })).toEqual({});
    expect(
      pickUpstreamHeaders({
        authorization: 'Bearer forged',
        'x-access-token': 'tok-1',
      }),
    ).toEqual({ authorization: 'Bearer tok-1' });
  });

  it('restores If-Match from the tunnel header', () => {
    expect(pickUpstreamHeaders({ [IF_MATCH_PROXY_HEADER]: 'W/"e1"' })).toEqual({
      'if-match': 'W/"e1"',
    });
  });

  it('prefers the tunnelled etag over a raw If-Match', () => {
    expect(
      pickUpstreamHeaders({
        'if-match': '"raw"',
        [IF_MATCH_PROXY_HEADER]: '"tunnelled"',
      }),
    ).toEqual({ 'if-match': '"tunnelled"' });
  });

  it('leaves the inbound headers untouched', () => {
    const headers = { [IF_MATCH_PROXY_HEADER]: '"e1"', cookie: 'a=b' };
    pickUpstreamHeaders(headers);
    expect(headers).toEqual({ [IF_MATCH_PROXY_HEADER]: '"e1"', cookie: 'a=b' });
  });
});
