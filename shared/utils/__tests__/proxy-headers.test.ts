// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  IF_MATCH_PROXY_HEADER,
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
