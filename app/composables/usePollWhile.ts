import type { MaybeRefOrGetter } from 'vue';

/**
 * Run `fn` on a fixed interval only while `active` is true.
 *
 * Handles start/stop on `active` transitions, clears the timer when the
 * calling scope is disposed (component unmount, or app teardown when called
 * from a plugin), and swallows errors thrown by `fn` so a transient failure
 * doesn't stop polling. Used for refreshing running-execution state, for
 * pulling in new executions on the list page, and for the proactive token
 * refresh in `auth-state.ts`.
 *
 * @param active - reactive boolean/getter gating the poll
 * @param fn - work to perform each tick (may be async)
 * @param intervalMs - poll cadence in milliseconds
 */
export const usePollWhile = (
  active: MaybeRefOrGetter<boolean>,
  fn: () => void | Promise<void>,
  intervalMs: number,
): void => {
  const { geinsLogError } = useGeinsLog('usePollWhile');
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = async () => {
    try {
      await fn();
    } catch (err) {
      geinsLogError('poll tick failed', err);
    }
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(tick, intervalMs);
  };

  watch(
    () => toValue(active),
    (running) => {
      if (running) start();
      else stop();
    },
    { immediate: true },
  );

  onScopeDispose(stop);
};
