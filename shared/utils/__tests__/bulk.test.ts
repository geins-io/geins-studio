import { describe, it, expect, vi } from 'vitest';
import { BULK_CHUNK_SIZE, chunkIds, runInChunks } from '../bulk';

const ids = (n: number, prefix = 'a') =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('chunkIds', () => {
  it('splits into chunks of at most 100', () => {
    const chunks = chunkIds(ids(250));
    expect(chunks.map((c) => c.length)).toEqual([100, 100, 50]);
    expect(BULK_CHUNK_SIZE).toBe(100);
  });

  it('returns one chunk at exactly the limit', () => {
    expect(chunkIds(ids(100))).toHaveLength(1);
  });

  it('returns no chunks for no ids', () => {
    expect(chunkIds([])).toEqual([]);
  });

  it('drops duplicates before chunking', () => {
    expect(chunkIds(['a', 'b', 'a', 'c', 'b'], 2)).toEqual([['a', 'b'], ['c']]);
  });
});

describe('runInChunks', () => {
  it('runs the chunks one after another, in order', async () => {
    const order: string[] = [];
    let running = 0;
    const call = vi.fn(async (chunk: string[]) => {
      running += 1;
      expect(running).toBe(1);
      await Promise.resolve();
      order.push(chunk[0]!);
      running -= 1;
    });
    const result = await runInChunks(ids(5), call, 2);
    expect(call).toHaveBeenCalledTimes(3);
    expect(order).toEqual(['a0', 'a2', 'a4']);
    expect(result).toEqual({ succeeded: ids(5), failed: [], errors: [] });
  });

  it('fails a whole chunk when its call rejects and keeps going', async () => {
    const error = new Error('Assets not found.');
    const call = vi.fn(async (_chunk: string[], index: number) => {
      if (index === 1) throw error;
    });
    const result = await runInChunks(ids(5), call, 2);
    expect(call).toHaveBeenCalledTimes(3);
    expect(result.succeeded).toEqual(['a0', 'a1', 'a4']);
    expect(result.failed).toEqual(['a2', 'a3']);
    expect(result.errors).toEqual([error]);
  });

  it('makes no calls for no ids', async () => {
    const call = vi.fn();
    await expect(runInChunks([], call)).resolves.toEqual({
      succeeded: [],
      failed: [],
      errors: [],
    });
    expect(call).not.toHaveBeenCalled();
  });
});
