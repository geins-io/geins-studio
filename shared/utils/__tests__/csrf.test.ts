// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { csrfRejection, type CsrfRequest } from '../csrf';

const HOST = 'studio.geins.io';
const sameOrigin: CsrfRequest = {
  method: 'POST',
  host: HOST,
  secFetchSite: 'same-origin',
  origin: `https://${HOST}`,
  csrfHeader: '1',
};

describe('csrfRejection', () => {
  it.each(['GET', 'HEAD', 'OPTIONS', 'get'])(
    'lets the safe method %s through, even cross-site and without the header',
    (method) => {
      expect(
        csrfRejection({ method, host: HOST, secFetchSite: 'cross-site' }),
      ).toBeUndefined();
    },
  );

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'lets a same-origin %s with the header through',
    (method) => {
      expect(csrfRejection({ ...sameOrigin, method })).toBeUndefined();
    },
  );

  it.each(['cross-site', 'same-site', 'none'])(
    'refuses sec-fetch-site %s',
    (secFetchSite) => {
      expect(csrfRejection({ ...sameOrigin, secFetchSite })).toBe(
        `sec-fetch-site ${secFetchSite}`,
      );
    },
  );

  it('trusts sec-fetch-site over a matching origin', () => {
    expect(
      csrfRejection({ ...sameOrigin, secFetchSite: 'cross-site' }),
    ).toBeDefined();
  });

  describe('without sec-fetch-site', () => {
    const noFetchSite = { ...sameOrigin, secFetchSite: undefined };

    it('lets a matching origin through', () => {
      expect(csrfRejection(noFetchSite)).toBeUndefined();
    });

    it('compares the port too', () => {
      expect(
        csrfRejection({
          ...noFetchSite,
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
        }),
      ).toBeUndefined();
      expect(
        csrfRejection({
          ...noFetchSite,
          host: 'localhost:3000',
          origin: 'http://localhost:4000',
        }),
      ).toBe('origin localhost:4000');
    });

    it('refuses a foreign origin', () => {
      expect(
        csrfRejection({ ...noFetchSite, origin: 'https://evil.example' }),
      ).toBe('origin evil.example');
    });

    it('refuses a sibling subdomain', () => {
      expect(
        csrfRejection({ ...noFetchSite, origin: `https://qa.${HOST}` }),
      ).toBe(`origin qa.${HOST}`);
    });

    it.each(['null', 'not a url'])('refuses the origin %j', (origin) => {
      expect(csrfRejection({ ...noFetchSite, origin })).toBe('bad origin');
    });

    it('falls back to the header alone without any same-origin signal', () => {
      expect(
        csrfRejection({ ...noFetchSite, origin: undefined }),
      ).toBeUndefined();
      expect(
        csrfRejection({
          ...noFetchSite,
          origin: undefined,
          csrfHeader: undefined,
        }),
      ).toBe('missing csrf header');
    });
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['wrong', 'true'],
  ])('refuses a %s header', (_, csrfHeader) => {
    expect(csrfRejection({ ...sameOrigin, csrfHeader })).toBe(
      'missing csrf header',
    );
  });
});
