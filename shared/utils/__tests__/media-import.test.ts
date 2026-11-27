// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { MAX_FILE_BYTES } from '../asset';
import {
  MEDIA_IMPORT_MAX_REDIRECTS,
  areResolvedAddressesAllowed,
  checkImportSourceUrl,
  importMimeType,
  importSizeFromHeaders,
  importTransferProblem,
  isAllowedUploadUrl,
  isBlockedAddress,
  mediaImportErrorMessageKey,
  needsRangeProbe,
  parseMediaImportProbe,
  parseMediaImportTransfer,
  resolveImportRedirect,
} from '../media-import';
import { UPLOAD_ORIGINS } from '../security-headers';

describe('isBlockedAddress', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '100.127.255.254',
    '127.0.0.1',
    '127.255.255.255',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '198.51.100.7',
    '203.0.113.9',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
  ])('refuses the non-public IPv4 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    '1.1.1.1',
    '8.8.8.8',
    '100.63.255.255',
    '100.128.0.0',
    '172.15.255.255',
    '172.32.0.0',
    '169.253.255.255',
    '20.60.1.1',
  ])('allows the public IPv4 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it.each([
    '::',
    '::1',
    '[::1]',
    '::0.0.0.1',
    'fc00::1',
    'fd12:3456:789a::1',
    'fe80::1',
    'fe80::1%eth0',
    'fec0::1',
    'ff02::1',
    '100::1',
    '2001:db8::1',
    '2001::1',
    '64:ff9b:1::1',
  ])('refuses the non-public IPv6 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.1',
    '::ffff:169.254.169.254',
    '::ffff:a9fe:a9fe',
    '0:0:0:0:0:ffff:192.168.0.1',
    '64:ff9b::7f00:1',
    '64:ff9b::10.0.0.1',
    '2002:7f00:1::1',
    '2002:a9fe:a9fe::',
  ])('refuses %s, which reaches a private IPv4', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each([
    '2606:4700:4700::1111',
    '2a00:1450:4001:80b::200e',
    '::ffff:8.8.8.8',
    '64:ff9b::808:808',
    '2002:808:808::1',
  ])('allows the public IPv6 %s', (ip) => {
    expect(isBlockedAddress(ip)).toBe(false);
  });

  it.each([
    '',
    'example.com',
    '1.2.3',
    '1.2.3.256',
    '::g',
    '1::2::3',
    '1:2:3:4:5:6:7:8:9',
  ])('refuses %j, which is not an address', (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });
});

describe('areResolvedAddressesAllowed', () => {
  it('allows an answer of public addresses only', () => {
    expect(
      areResolvedAddressesAllowed(['93.184.215.14', '2606:2800:21f:cb07::1']),
    ).toBe(true);
  });

  it.each([
    [['93.184.215.14', '127.0.0.1']],
    [['10.0.0.1', '8.8.8.8']],
    [['2606:2800:21f:cb07::1', '::ffff:192.168.0.1']],
    [['169.254.169.254']],
    [[]],
  ])('refuses %j', (addresses) => {
    expect(areResolvedAddressesAllowed(addresses)).toBe(false);
  });
});

describe('checkImportSourceUrl', () => {
  it('accepts a public https URL and keeps its query', () => {
    const result = checkImportSourceUrl(
      ' https://cdn.example.com/a/b.jpg?sig=x ',
    );
    expect('url' in result && result.url.href).toBe(
      'https://cdn.example.com/a/b.jpg?sig=x',
    );
  });

  it.each([
    'http://cdn.example.com/a.jpg',
    'ftp://cdn.example.com/a.jpg',
    'file:///etc/passwd',
    'data:image/png;base64,AAAA',
    'https://user:pass@cdn.example.com/a.jpg',
    'https://user@cdn.example.com/a.jpg',
    'not a url',
    '/relative/path.jpg',
    '',
  ])('refuses %j as invalid', (raw) => {
    expect(checkImportSourceUrl(raw)).toEqual({ error: 'SOURCE_INVALID' });
  });

  it.each([undefined, null, 42, {}, `https://a.example/${'x'.repeat(5000)}`])(
    'refuses %j as invalid',
    (raw) => {
      expect(checkImportSourceUrl(raw)).toEqual({ error: 'SOURCE_INVALID' });
    },
  );

  it.each([
    'https://localhost/a.jpg',
    'https://LOCALHOST:8443/a.jpg',
    'https://localhost./a.jpg',
    'https://api.localhost/a.jpg',
    'https://127.0.0.1/a.jpg',
    'https://169.254.169.254/latest/meta-data/',
    'https://10.0.0.5/a.jpg',
    'https://[::1]/a.jpg',
    'https://[::ffff:127.0.0.1]/a.jpg',
    'https://[fd00::1]/a.jpg',
    // WHATWG URL normalizes these to 127.0.0.1.
    'https://2130706433/a.jpg',
    'https://0x7f.1/a.jpg',
    'https://017700000001/a.jpg',
  ])('refuses %j as blocked', (raw) => {
    expect(checkImportSourceUrl(raw)).toEqual({ error: 'SOURCE_BLOCKED' });
  });

  it('leaves hostnames to the DNS check', () => {
    expect('url' in checkImportSourceUrl('https://internal.corp/a.jpg')).toBe(
      true,
    );
  });
});

describe('isAllowedUploadUrl', () => {
  const sas = '/media/abc.jpg?sv=2024&sig=xyz';

  it.each(UPLOAD_ORIGINS)('allows a SAS URL on %s', (origin) => {
    expect(isAllowedUploadUrl(`${origin}${sas}`)).toBe(true);
  });

  it('normalizes case and the default port', () => {
    expect(
      isAllowedUploadUrl(
        `https://GESTMEDIAPROD.blob.core.windows.net:443${sas}`,
      ),
    ).toBe(true);
  });

  it.each([
    `https://evilaccount.blob.core.windows.net${sas}`,
    `https://gestmediaprod.blob.core.windows.net.evil.com${sas}`,
    `https://evil.com/gestmediaprod.blob.core.windows.net${sas}`,
    `http://gestmediaprod.blob.core.windows.net${sas}`,
    `https://gestmediaprod.blob.core.windows.net:8443${sas}`,
    `https://user:pw@gestmediaprod.blob.core.windows.net${sas}`,
    'not a url',
    undefined,
    42,
  ])('refuses %j', (raw) => {
    expect(isAllowedUploadUrl(raw)).toBe(false);
  });
});

describe('resolveImportRedirect', () => {
  const from = new URL('https://cdn.example.com/files/a.jpg?sig=1');

  it('resolves a relative Location against the current URL', () => {
    const next = resolveImportRedirect(from, '../b.jpg', 0);
    expect('url' in next && next.url.href).toBe(
      'https://cdn.example.com/b.jpg',
    );
  });

  it('follows an absolute redirect to another public host', () => {
    const next = resolveImportRedirect(from, 'https://other.example/x', 2);
    expect('url' in next && next.url.host).toBe('other.example');
  });

  it.each([
    'https://127.0.0.1/a.jpg',
    'https://169.254.169.254/latest/meta-data/',
    'https://[::ffff:10.0.0.1]/',
    'https://localhost/a.jpg',
  ])('re-checks the hop and refuses %j', (location) => {
    expect(resolveImportRedirect(from, location, 0)).toEqual({
      error: 'SOURCE_BLOCKED',
    });
  });

  it.each([
    'http://cdn.example.com/a.jpg',
    'https://user:pw@cdn.example.com/a.jpg',
    'https://[bad/',
  ])(
    "treats an unusable hop (%s) as unreachable, not as the user's invalid URL",
    (location) => {
      expect(resolveImportRedirect(from, location, 0)).toEqual({
        error: 'SOURCE_UNREACHABLE',
      });
    },
  );

  it('stops after the redirect cap', () => {
    expect(
      resolveImportRedirect(from, '/b.jpg', MEDIA_IMPORT_MAX_REDIRECTS - 1),
    ).toHaveProperty('url');
    expect(
      resolveImportRedirect(from, '/b.jpg', MEDIA_IMPORT_MAX_REDIRECTS),
    ).toEqual({ error: 'SOURCE_UNREACHABLE' });
  });

  it('treats a redirect without Location as unreachable', () => {
    expect(resolveImportRedirect(from, undefined, 0)).toEqual({
      error: 'SOURCE_UNREACHABLE',
    });
  });
});

describe('importSizeFromHeaders', () => {
  it('reads Content-Length from a 200', () => {
    expect(
      importSizeFromHeaders({ status: 200, contentLength: '9022' }),
    ).toEqual({ sizeBytes: 9022 });
  });

  it('reads the Content-Range total from a 206', () => {
    expect(
      importSizeFromHeaders({
        status: 206,
        contentLength: '1',
        contentRange: 'bytes 0-0/23774',
      }),
    ).toEqual({ sizeBytes: 23774 });
  });

  it.each([
    { status: 200 },
    { status: 200, contentLength: 'abc' },
    { status: 200, contentLength: '-1' },
    { status: 206, contentRange: 'bytes 0-0/*' },
    { status: 206, contentLength: '1' },
    { status: 200, contentLength: '100', contentEncoding: 'gzip' },
    { status: 200, contentLength: '0' },
    { status: 206, contentRange: 'bytes */0' },
  ])('answers SOURCE_SIZE_UNKNOWN for %j', (headers) => {
    expect(importSizeFromHeaders(headers)).toEqual({
      error: 'SOURCE_SIZE_UNKNOWN',
    });
  });

  it('accepts an explicit identity encoding', () => {
    expect(
      importSizeFromHeaders({
        status: 200,
        contentLength: '5',
        contentEncoding: 'identity',
      }),
    ).toEqual({ sizeBytes: 5 });
  });

  it('refuses a file over the 1 GB cap', () => {
    expect(
      importSizeFromHeaders({
        status: 200,
        contentLength: String(MAX_FILE_BYTES + 1),
      }),
    ).toEqual({ error: 'SOURCE_TOO_LARGE' });
    expect(
      importSizeFromHeaders({
        status: 200,
        contentLength: String(MAX_FILE_BYTES),
      }),
    ).toEqual({ sizeBytes: MAX_FILE_BYTES });
  });

  it.each([404, 410])('answers SOURCE_NOT_FOUND for %i', (status) => {
    expect(importSizeFromHeaders({ status })).toEqual({
      error: 'SOURCE_NOT_FOUND',
    });
  });

  it.each([204, 401, 403, 405, 500, 503])(
    'answers SOURCE_UNREACHABLE for %i',
    (status) => {
      expect(importSizeFromHeaders({ status })).toEqual({
        error: 'SOURCE_UNREACHABLE',
      });
    },
  );
});

describe('needsRangeProbe', () => {
  it('retries a refused or lengthless HEAD, not a missing or oversize file', () => {
    expect(needsRangeProbe('SOURCE_UNREACHABLE')).toBe(true);
    expect(needsRangeProbe('SOURCE_SIZE_UNKNOWN')).toBe(true);
    expect(needsRangeProbe('SOURCE_NOT_FOUND')).toBe(false);
    expect(needsRangeProbe('SOURCE_TOO_LARGE')).toBe(false);
  });
});

describe('importTransferProblem', () => {
  it('passes a 200 whose length matches, or that has none', () => {
    expect(
      importTransferProblem({ status: 200, contentLength: '10' }, 10),
    ).toBeUndefined();
    expect(importTransferProblem({ status: 200 }, 10)).toBeUndefined();
  });

  it.each([
    [{ status: 200, contentLength: '11' }, 'SOURCE_SIZE_MISMATCH'],
    [{ status: 200, contentEncoding: 'br' }, 'SOURCE_SIZE_MISMATCH'],
    [{ status: 404 }, 'SOURCE_NOT_FOUND'],
    [{ status: 206, contentLength: '10' }, 'SOURCE_UNREACHABLE'],
    [{ status: 500 }, 'SOURCE_UNREACHABLE'],
  ])('refuses %j with %s', (headers, code) => {
    expect(importTransferProblem(headers, 10)).toBe(code);
  });
});

describe('importMimeType', () => {
  it.each([
    ['image/jpeg', 'image/jpeg'],
    ['Image/PNG; charset=binary', 'image/png'],
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    ['image/svg+xml', 'image/svg+xml'],
    [undefined, ''],
    ['', ''],
    ['nonsense', ''],
    ['text/html\r\nx-evil: 1', ''],
  ])('%j → %j', (header, expected) => {
    expect(importMimeType(header)).toBe(expected);
  });
});

describe('parseMediaImportProbe', () => {
  it('takes a string url', () => {
    expect(parseMediaImportProbe({ url: 'https://a.example/x' })).toEqual({
      value: { url: 'https://a.example/x' },
    });
  });

  it.each([undefined, null, {}, { url: 1 }, 'https://a.example/x'])(
    'refuses %j',
    (body) => {
      expect(parseMediaImportProbe(body)).toHaveProperty('problem');
    },
  );
});

describe('parseMediaImportTransfer', () => {
  const valid = {
    sourceUrl: 'https://cdn.example.com/a.jpg',
    uploadUrl: `${UPLOAD_ORIGINS[0]}/media/a.jpg?sig=1`,
    sizeBytes: 1024,
    mimeType: 'image/jpeg',
  };

  it('takes a well-formed body', () => {
    expect(parseMediaImportTransfer(valid)).toEqual({ value: valid });
  });

  it('leaves the source URL and size cap to the row checks', () => {
    expect(
      parseMediaImportTransfer({
        ...valid,
        sourceUrl: 'http://127.0.0.1/',
        sizeBytes: MAX_FILE_BYTES + 1,
      }),
    ).toHaveProperty('value');
  });

  it.each([
    [
      { ...valid, uploadUrl: 'https://evil.example/put' },
      'Upload URL not allowed',
    ],
    [{ ...valid, sizeBytes: -1 }, 'Invalid sizeBytes'],
    [{ ...valid, sizeBytes: 1.5 }, 'Invalid sizeBytes'],
    [{ ...valid, sizeBytes: '1024' }, 'Invalid body'],
    [{ ...valid, mimeType: 'jpeg' }, 'Invalid mimeType'],
    [{ ...valid, mimeType: 'image/jpeg\r\nx-evil: 1' }, 'Invalid mimeType'],
    [{ ...valid, sourceUrl: undefined }, 'Invalid body'],
    [null, 'Invalid body'],
  ])('refuses %j: %s', (body, problem) => {
    expect(parseMediaImportTransfer(body)).toEqual({ problem });
  });
});

describe('mediaImportErrorMessageKey', () => {
  it('maps every code to an asset_library key', () => {
    expect(mediaImportErrorMessageKey('SOURCE_BLOCKED')).toBe(
      'asset_library.import_error_source_blocked',
    );
    expect(mediaImportErrorMessageKey('SOURCE_TOO_LARGE')).toBe(
      'asset_library.upload_reject_file_too_large',
    );
  });
});
