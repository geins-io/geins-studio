// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  cn,
  getEntityNameById,
  generateInternalId,
  flagClass,
  languageToCountryCode,
  prettifyLangKey,
} from '../index';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    const hidden = false as boolean;
    expect(cn('base', hidden && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

describe('getEntityNameById', () => {
  const entities = [
    { _id: '1', name: 'First', displayName: 'Display First' },
    { _id: '2', name: 'Second' },
    { _id: '3', name: 'Third', displayName: '' },
  ];

  it('returns displayName when available', () => {
    expect(getEntityNameById('1', entities)).toBe('Display First');
  });

  it('returns name when displayName is not set', () => {
    expect(getEntityNameById('2', entities)).toBe('Second');
  });

  it('returns name when displayName is empty string (falsy)', () => {
    expect(getEntityNameById('3', entities)).toBe('Third');
  });

  it('returns the id when entity is not found', () => {
    expect(getEntityNameById('999', entities)).toBe('999');
  });

  it('returns the id when list is empty', () => {
    expect(getEntityNameById('1', [])).toBe('1');
  });
});

describe('generateInternalId', () => {
  it('starts with "internal_" prefix', () => {
    expect(generateInternalId()).toMatch(/^internal_/);
  });

  it('contains a timestamp component', () => {
    const before = Date.now();
    const id = generateInternalId();
    const after = Date.now();
    const timestamp = Number(id.split('_')[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('generates unique ids across multiple calls', () => {
    const ids = new Set(
      Array.from({ length: 100 }, () => generateInternalId()),
    );
    expect(ids.size).toBe(100);
  });

  it('matches expected format: internal_{timestamp}_{random}', () => {
    expect(generateInternalId()).toMatch(/^internal_\d+_[a-z0-9]+$/);
  });
});

describe('flagClass', () => {
  it('returns square background flag classes by default', () => {
    expect(flagClass('se')).toBe('fib fis fi-se');
  });

  it('returns non-square flag classes when square is false', () => {
    expect(flagClass('gb', false)).toBe('fib fi-gb');
  });

  it('lowercases the country code', () => {
    expect(flagClass('US')).toBe('fib fis fi-us');
  });
});

describe('prettifyLangKey', () => {
  const keys = [
    'ORDER_PREPARED_SUBJECT',
    'ORDER_PREPARED_TITLE',
    'ORDER_PREPARED_INBOX_PREVIEW',
    'ORDER_PREPARED_MESSAGE_PARTIAL',
  ];

  it('strips common prefix and sentence-cases the remainder', () => {
    expect(prettifyLangKey('ORDER_PREPARED_SUBJECT', keys)).toBe('Subject');
    expect(prettifyLangKey('ORDER_PREPARED_TITLE', keys)).toBe('Title');
    expect(prettifyLangKey('ORDER_PREPARED_INBOX_PREVIEW', keys)).toBe('Inbox preview');
    expect(prettifyLangKey('ORDER_PREPARED_MESSAGE_PARTIAL', keys)).toBe('Message partial');
  });

  it('falls back to full prettified key for a single key', () => {
    expect(prettifyLangKey('ORDER_PREPARED_SUBJECT', ['ORDER_PREPARED_SUBJECT'])).toBe(
      'Order prepared subject',
    );
  });

  it('falls back to full prettified key for empty allKeys', () => {
    expect(prettifyLangKey('ORDER_PREPARED_SUBJECT', [])).toBe('Order prepared subject');
  });

  it('handles keys with no common prefix', () => {
    const mixed = ['FOO_BAR', 'BAZ_QUX'];
    expect(prettifyLangKey('FOO_BAR', mixed)).toBe('Foo bar');
    expect(prettifyLangKey('BAZ_QUX', mixed)).toBe('Baz qux');
  });

  it('partial common prefix — only shared segments stripped', () => {
    const partial = ['ORDER_SUBJECT', 'ORDER_TITLE', 'CUSTOMER_NAME'];
    expect(prettifyLangKey('ORDER_SUBJECT', partial)).toBe('Order subject');
  });
});

describe('languageToCountryCode', () => {
  it('maps "en" to "gb"', () => {
    expect(languageToCountryCode('en')).toBe('gb');
  });

  it('maps "sv" to "se"', () => {
    expect(languageToCountryCode('sv')).toBe('se');
  });

  it('maps "da" to "dk"', () => {
    expect(languageToCountryCode('da')).toBe('dk');
  });

  it('maps "ja" to "jp"', () => {
    expect(languageToCountryCode('ja')).toBe('jp');
  });

  it('falls back to the language code itself for unmapped codes', () => {
    expect(languageToCountryCode('fr')).toBe('fr');
  });

  it('handles codes with region subtags by using the language part', () => {
    expect(languageToCountryCode('en-US')).toBe('gb');
  });

  it('lowercases the input', () => {
    expect(languageToCountryCode('SV')).toBe('se');
  });
});
