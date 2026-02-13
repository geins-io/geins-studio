// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createTooltip } from '../tooltip';

const t = (
  key: string,
  _values?: Record<string, unknown>,
  _pluralCount?: number,
) => key;

describe('createTooltip', () => {
  it('returns disabled tooltip when items array is empty', () => {
    const result = createTooltip({ items: [], entityName: 'products', t });
    expect(result.disabled).toBe(true);
    expect(result.displayValue).toBe('no_entity');
    expect(result.contentValue).toBe('');
  });

  it('returns disabled tooltip when items is undefined (default)', () => {
    const result = createTooltip({ entityName: 'products', t });
    expect(result.disabled).toBe(true);
  });

  it('returns enabled tooltip with translation key when items exist', () => {
    const result = createTooltip({
      items: ['a', 'b', 'c'],
      entityName: 'products',
      t,
    });
    expect(result.disabled).toBe(false);
    expect(result.displayValue).toBe('nr_of_entity');
  });

  it('uses custom formatter for content value', () => {
    const result = createTooltip({
      items: [{ name: 'A' }, { name: 'B' }],
      entityName: 'products',
      formatter: (item) => item.name,
      t,
    });
    expect(result.contentValue).toBe('A, B');
  });

  it('returns empty contentValue when no formatter is provided', () => {
    const result = createTooltip({
      items: ['a', 'b'],
      entityName: 'products',
      t,
    });
    expect(result.contentValue).toBe('');
  });

  it('uses custom emptyMessage when provided and items are empty', () => {
    const result = createTooltip({
      items: [],
      entityName: 'products',
      emptyMessage: 'No products available',
      t,
    });
    expect(result.displayValue).toBe('No products available');
  });

  it('handles single item with formatter', () => {
    const result = createTooltip({
      items: ['only'],
      entityName: 'item',
      formatter: (i) => i,
      t,
    });
    expect(result.disabled).toBe(false);
    expect(result.contentValue).toBe('only');
  });
});
