import type { MaybeRefOrGetter, Ref } from 'vue';

interface UseLiveClockReturnType {
  now: Ref<number>;
}

/**
 * Reactive "now" that ticks on a fixed interval only while `active` is true.
 *
 * Used for live-updating duration displays (execution detail + executions
 * list) so the cell value recomputes every second without rerunning expensive
 * work when nothing is running. The interval is cleared automatically when
 * `active` flips false and on component unmount.
 *
 * @param active - reactive boolean/getter gating the tick
 * @param intervalMs - tick cadence (default 1s)
 */
export const useLiveClock = (
  active: MaybeRefOrGetter<boolean>,
  intervalMs = 1000,
): UseLiveClockReturnType => {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    if (timer) return;
    now.value = Date.now();
    timer = setInterval(() => { now.value = Date.now(); }, intervalMs);
  };

  watch(
    () => toValue(active),
    (running) => {
      if (running) start();
      else stop();
    },
    { immediate: true },
  );

  onBeforeUnmount(stop);

  return { now };
};
