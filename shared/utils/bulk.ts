import type { BulkRunResult } from '#shared/types';

/** The most ids any bulk route accepts in one call. */
export const BULK_CHUNK_SIZE = 100;

/**
 * Split ids into chunks of at most `size`, dropping duplicates first — the bulk
 * routes refuse a body that lists an id twice.
 */
export function chunkIds(ids: string[], size = BULK_CHUNK_SIZE): string[][] {
  const unique = [...new Set(ids)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += size) {
    chunks.push(unique.slice(i, i + size));
  }
  return chunks;
}

/**
 * Run `call` once per chunk, one after another. Each call is all-or-nothing on
 * the backend, so a rejected call fails every id in its chunk and the run moves
 * on to the next one.
 */
export async function runInChunks(
  ids: string[],
  call: (chunk: string[], index: number) => Promise<unknown>,
  size = BULK_CHUNK_SIZE,
): Promise<BulkRunResult> {
  const result: BulkRunResult = {
    succeeded: [],
    failed: [],
    errors: [],
    responses: [],
  };
  const chunks = chunkIds(ids, size);
  for (const [index, chunk] of chunks.entries()) {
    try {
      result.responses.push(await call(chunk, index));
      result.succeeded.push(...chunk);
    } catch (error) {
      result.failed.push(...chunk);
      result.errors.push(error);
    }
  }
  return result;
}
