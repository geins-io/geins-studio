// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createEmailListSchema } from '../email-validation';

describe('createEmailListSchema', () => {
  const schema = createEmailListSchema('invalid');

  it('accepts an empty string', () => {
    expect(schema.safeParse('').success).toBe(true);
    expect(schema.safeParse('  ').success).toBe(true);
  });

  it('accepts a single address', () => {
    expect(schema.safeParse('orders@example.com').success).toBe(true);
  });

  it('accepts several comma-separated addresses', () => {
    expect(schema.safeParse('a@example.com,b@example.com').success).toBe(true);
    expect(
      schema.safeParse('a@example.com, b@example.com ,c@example.com').success,
    ).toBe(true);
  });

  it('rejects the list when any address is invalid', () => {
    expect(schema.safeParse('a@example.com, not-an-email').success).toBe(false);
    expect(schema.safeParse('not-an-email').success).toBe(false);
  });

  it('rejects empty entries', () => {
    expect(schema.safeParse('a@example.com,').success).toBe(false);
    expect(schema.safeParse('a@example.com,,b@example.com').success).toBe(
      false,
    );
  });

  it('rejects other separators', () => {
    expect(schema.safeParse('a@example.com; b@example.com').success).toBe(
      false,
    );
    expect(schema.safeParse('a@example.com b@example.com').success).toBe(false);
  });

  it('reports the given message', () => {
    const result = schema.safeParse('a@example.com, nope');
    expect(result.error?.issues[0]?.message).toBe('invalid');
  });
});
