// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { loginUrl, safeRedirect } from '../login-redirect';

describe('safeRedirect', () => {
  it.each([
    '/',
    '/orders/quotations',
    '/orders/quotations?status=sent&page=2',
    '/products/123#prices',
  ])('keeps the in-app path %s', (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each([
    ['a protocol-relative URL', '//evil.example'],
    ['an absolute URL', 'https://evil.example'],
    ['a backslash after the slash', '/\\evil.example'],
    ['a backslash further in', '/orders\\..\\evil'],
    ['a tab after the slash', '/\t/evil.example'],
    ['a newline after the slash', '/\n/evil.example'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a relative path', 'orders/quotations'],
    ['an empty string', ''],
  ])('falls back to / for %s', (_, value) => {
    expect(safeRedirect(value)).toBe('/');
  });

  it.each([
    ['an array', ['/orders', '/products']],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('falls back to / for %s', (_, value) => {
    expect(safeRedirect(value)).toBe('/');
  });
});

describe('loginUrl', () => {
  it('links to the bare login page from /', () => {
    expect(loginUrl('/')).toBe('/auth/login');
  });

  it('keeps every query param through the login round trip', () => {
    const fullPath = '/orders/quotations?status=sent&page=2';
    const url = new URL(loginUrl(fullPath), 'https://studio.example');

    expect([...url.searchParams.keys()]).toEqual(['redirect']);
    expect(safeRedirect(url.searchParams.get('redirect'))).toBe(fullPath);
  });
});
