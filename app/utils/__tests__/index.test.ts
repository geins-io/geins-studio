// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { cn, getEntityNameById, generateInternalId } from '../index';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
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
