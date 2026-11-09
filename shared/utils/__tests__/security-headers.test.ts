// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  CSP_REPORT_PATH,
  MEDIA_CDN_ORIGINS,
  UPLOAD_ORIGINS,
  contentSecurityPolicy,
  inlineScriptHashes,
  parseCspReports,
  reportOnlyCspHeaders,
} from '../security-headers';

// sha256-base64 of `alert(1)` and `a\nb`, from node:crypto.
const ALERT_HASH = "'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='";
const A_LF_B_HASH = "'sha256-fhj3NzEbLcOy8mndeDlrA1HxT7Zu+oefdoyyMYGIPHg='";

const directive = (csp: string, name: string) =>
  csp
    .split('; ')
    .find((d) => d.startsWith(`${name} `))
    ?.split(' ')
    .slice(1);

describe('inlineScriptHashes', () => {
  it('hashes classic, module and importmap scripts', async () => {
    const html = [
      '<script>alert(1)</script>',
      '<script type="module">a\nb</script>',
      '<script type="importmap">{"imports":{}}</script>',
    ].join('');
    const hashes = await inlineScriptHashes(html);
    expect(hashes).toHaveLength(3);
    expect(hashes.slice(0, 2)).toEqual([ALERT_HASH, A_LF_B_HASH]);
  });

  it('accepts JavaScript MIME types in any case and quoting', async () => {
    const html =
      "<script type='TEXT/JavaScript'>alert(1)</script><script type=application/javascript>a\nb</script>";
    expect(await inlineScriptHashes(html)).toEqual([ALERT_HASH, A_LF_B_HASH]);
  });

  it('skips external scripts and JSON data blocks', async () => {
    const html = [
      '<script type="module" src="/_nuxt/entry.js" crossorigin></script>',
      '<script type="application/json" id="__NUXT_DATA__">[1]</script>',
      '<script type="application/ld+json">{}</script>',
    ].join('');
    expect(await inlineScriptHashes(html)).toEqual([]);
  });

  it('does not mistake data-src for src', async () => {
    expect(
      await inlineScriptHashes('<script data-src="x">alert(1)</script>'),
    ).toEqual([ALERT_HASH]);
  });

  it('normalizes CRLF like the HTML parser does', async () => {
    expect(await inlineScriptHashes('<script>a\r\nb</script>')).toEqual([
      A_LF_B_HASH,
    ]);
  });

  it('lists a repeated script once', async () => {
    const html = '<script>alert(1)</script><script>alert(1)</script>';
    expect(await inlineScriptHashes(html)).toEqual([ALERT_HASH]);
  });
});

describe('contentSecurityPolicy', () => {
  it('allows the hashed scripts and nothing else inline', () => {
    const csp = contentSecurityPolicy({ scriptHashes: [ALERT_HASH] });
    expect(directive(csp, 'script-src')).toEqual(["'self'", ALERT_HASH]);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-inline'");
  });

  it('allows the media CDN and the upload host', () => {
    const csp = contentSecurityPolicy({ scriptHashes: [] });
    expect(directive(csp, 'img-src')).toEqual(
      expect.arrayContaining(['data:', 'blob:', ...MEDIA_CDN_ORIGINS]),
    );
    expect(directive(csp, 'connect-src')).toEqual([
      "'self'",
      ...MEDIA_CDN_ORIGINS,
      ...UPLOAD_ORIGINS,
    ]);
  });

  it('reports to the CSP endpoint through report-uri only', () => {
    const csp = contentSecurityPolicy({ scriptHashes: [] });
    expect(directive(csp, 'report-uri')).toEqual([CSP_REPORT_PATH]);
    // Chrome drops report-uri when report-to is present.
    expect(directive(csp, 'report-to')).toBeUndefined();
  });

  it('never allows eval', () => {
    const csp = contentSecurityPolicy({
      scriptHashes: [],
      vercelPreview: true,
    });
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('adds the Vercel toolbar only on preview', () => {
    const plain = contentSecurityPolicy({ scriptHashes: [] });
    const preview = contentSecurityPolicy({
      scriptHashes: [],
      vercelPreview: true,
    });
    expect(plain).not.toContain('vercel.live');
    expect(directive(preview, 'script-src')).toContain('https://vercel.live');
    expect(directive(preview, 'frame-src')).toContain('https://vercel.live');
  });

  it('does not let the preview sources leak into later policies', () => {
    contentSecurityPolicy({ scriptHashes: [], vercelPreview: true });
    expect(contentSecurityPolicy({ scriptHashes: [] })).not.toContain(
      'vercel.live',
    );
  });
});

describe('reportOnlyCspHeaders', () => {
  it('sets only the report-only policy, hashed from the document', async () => {
    const headers = await reportOnlyCspHeaders('<script>alert(1)</script>');
    expect(Object.keys(headers)).toEqual([
      'Content-Security-Policy-Report-Only',
    ]);
    expect(headers['Content-Security-Policy-Report-Only']).toContain(
      ALERT_HASH,
    );
  });
});

describe('parseCspReports', () => {
  it('reads the report-uri shape', () => {
    expect(
      parseCspReports({
        'csp-report': {
          'document-uri': 'https://geins.studio/asset-library?q=secret',
          'violated-directive': 'img-src',
          'effective-directive': 'img-src',
          'blocked-uri': 'https://evil.test/x.png',
          'source-file': 'https://geins.studio/_nuxt/a.js',
          'line-number': 12,
        },
      }),
    ).toEqual([
      {
        documentUrl: 'https://geins.studio/asset-library',
        directive: 'img-src',
        blockedUrl: 'https://evil.test/x.png',
        sourceFile: 'https://geins.studio/_nuxt/a.js',
        line: 12,
        sample: '',
      },
    ]);
  });

  it('reads Reporting API batches and skips other report types', () => {
    const reports = parseCspReports([
      { type: 'deprecation', body: {} },
      {
        type: 'csp-violation',
        body: {
          documentURL: 'https://geins.studio/#x',
          effectiveDirective: 'script-src-elem',
          blockedURL: 'inline',
          sample: 'alert(1)',
        },
      },
    ]);
    expect(reports).toEqual([
      {
        documentUrl: 'https://geins.studio/',
        directive: 'script-src-elem',
        blockedUrl: 'inline',
        sourceFile: '',
        line: null,
        sample: 'alert(1)',
      },
    ]);
  });

  it('caps the batch and truncates long fields', () => {
    const entry = {
      type: 'csp-violation',
      body: { effectiveDirective: 'x'.repeat(1000) },
    };
    const reports = parseCspReports(Array.from({ length: 50 }, () => entry));
    expect(reports).toHaveLength(20);
    expect(reports[0]!.directive).toHaveLength(300);
  });

  it('ignores anything that is not a report', () => {
    expect(parseCspReports(null)).toEqual([]);
    expect(parseCspReports('nope')).toEqual([]);
    expect(parseCspReports({ other: 1 })).toEqual([]);
  });
});
