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
 * Once a call settles, the next caller starts a new one. `run` gets the
 * arguments of the caller that started the call, as they were before the
 * wait for the lock; callers that join an in-flight call share its result.
 *
 * Web Locks aren't reentrant: `run` must never wait on a call under the same
 * lock name, or it deadlocks.
 */
export const createSingleFlight = <T, A extends unknown[] = []>(
  run: (...args: A) => Promise<T>,
  { lockName, locks }: SingleFlightOptions,
): ((...args: A) => Promise<T>) => {
  let inFlight: Promise<T> | null = null;

  return (...args: A) => {
    inFlight ??= (
      locks ? locks.request(lockName, () => run(...args)) : run(...args)
    ).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
};
