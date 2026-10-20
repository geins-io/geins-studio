/** One file to fetch into a zip: the entry name and where its bytes live. */
export interface ZipSource {
  name: string;
  url: string;
}

export interface ZipFailure {
  name: string;
  error: unknown;
}

export interface BuildZipOptions {
  signal?: AbortSignal;
  /** Fetches in flight at once. */
  concurrency?: number;
  /** Called after each file settles, added or failed. */
  onProgress?: (done: number, total: number) => void;
  fetch?: typeof globalThis.fetch;
}

export interface BuildZipResult {
  /** `null` when nothing was added or the run was aborted. */
  blob: Blob | null;
  added: number;
  failed: ZipFailure[];
}

export const ZIP_CONCURRENCY = 4;

/**
 * Make names unique the way a file manager would: `hero.jpg`, `hero (2).jpg`,
 * `hero (3).jpg`. Case-insensitive, since unzipping on macOS/Windows is.
 */
export function uniqueFileNames(names: readonly string[]): string[] {
  const taken = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let candidate = name;
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
      candidate = `${stem} (${n})${ext}`;
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  });
}

/** Path separators would nest an entry in folders; the zip is flat. */
export function flatFileName(name: string): string {
  return name.replace(/[/\\]/g, '_');
}

/** `{prefix}-YYYY-MM-DD.zip`, in local time. */
export function zipFileName(prefix: string, date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${prefix}-${day}.zip`;
}

/**
 * Fetch every source and pack it into one flat, uncompressed zip in memory.
 * Stored, not deflated: assets are mostly already-compressed media, so
 * deflating costs CPU for next to nothing. Failed files are skipped and
 * reported. fflate is imported lazily so it only loads on first use.
 */
export async function buildZip(
  sources: readonly ZipSource[],
  options: BuildZipOptions = {},
): Promise<BuildZipResult> {
  const {
    signal,
    concurrency = ZIP_CONCURRENCY,
    onProgress,
    fetch: fetchFile = globalThis.fetch,
  } = options;
  const { Zip, ZipPassThrough } = await import('fflate');

  const names = uniqueFileNames(
    sources.map((source) => flatFileName(source.name)),
  );
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const failed: ZipFailure[] = [];
  let resolveDone!: () => void;
  let rejectDone!: (error: Error) => void;
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });
  const zip = new Zip((error, chunk, final) => {
    if (error) return rejectDone(error);
    chunks.push(chunk);
    if (final) resolveDone();
  });

  let next = 0;
  let settled = 0;
  let added = 0;
  // Each entry is pushed whole as soon as it lands, so entries never
  // interleave even though fetches finish out of order.
  async function worker() {
    while (next < sources.length && !signal?.aborted) {
      const index = next++;
      const source = sources[index]!;
      try {
        const res = await fetchFile(source.url, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        if (signal?.aborted) return;
        const entry = new ZipPassThrough(names[index]!);
        zip.add(entry);
        entry.push(data, true);
        added++;
      } catch (error) {
        if (signal?.aborted) return;
        failed.push({ name: source.name, error });
      }
      onProgress?.(++settled, sources.length);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, worker),
  );

  if (signal?.aborted || !added) {
    zip.terminate();
    return { blob: null, added, failed };
  }
  zip.end();
  await done;
  return { blob: new Blob(chunks, { type: 'application/zip' }), added, failed };
}
