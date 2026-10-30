/**
 * The part of the Web Locks API (`navigator.locks`) that `createSingleFlight`
 * needs. Injectable so the helper stays testable with a fake lock.
 */
export interface LockRequester {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export interface SingleFlightOptions {
  /** Lock name shared by every tab; calls under the same name run one at a time. */
  lockName: string;
  /** `navigator.locks` when the browser supports it; omit for per-tab only. */
  locks?: LockRequester;
}

/**
 * Wraps `run` so concurrent callers in this tab share one in-flight call, and,
 * when `locks` is given, calls across tabs run one at a time under `lockName`.
 * Once a call settles, the next caller starts a new one.
 *
 * Web Locks aren't reentrant: `run` must never wait on a call under the same
 * lock name, or it deadlocks.
 */
export const createSingleFlight = <T>(
  run: () => Promise<T>,
  { lockName, locks }: SingleFlightOptions,
): (() => Promise<T>) => {
  let inFlight: Promise<T> | null = null;

  return () => {
    inFlight ??= (locks ? locks.request(lockName, run) : run()).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
};
