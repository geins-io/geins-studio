import type { MaybeRefOrGetter, Ref } from 'vue';

export interface UseRefetchDimReturnType {
  /** True once `refetching` has held for `delayMs`; false as soon as it ends. */
  dimmed: Readonly<Ref<boolean>>;
}

/** Long enough that a fast query never flashes the dim. */
const REFETCH_DIM_DELAY_MS = 200;

/**
 * Delayed busy flag for a refetch that keeps the current results on screen.
 *
 * Drives the shared refetch look: `opacity-60 pointer-events-none` on the
 * results and a small spinner. Set `aria-busy` from the raw flag instead, so
 * assistive tech hears about every refetch, not just the slow ones.
 *
 * @param refetching - reactive boolean/getter, true while a refetch runs
 * @param delayMs - how long `refetching` must hold before `dimmed` turns on
 */
export const useRefetchDim = (
  refetching: MaybeRefOrGetter<boolean>,
  delayMs = REFETCH_DIM_DELAY_MS,
): UseRefetchDimReturnType => {
  const dimmed = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  watch(
    () => toValue(refetching),
    (active) => {
      clear();
      if (!active) {
        dimmed.value = false;
        return;
      }
      timer = setTimeout(() => {
        dimmed.value = true;
      }, delayMs);
    },
    { immediate: true },
  );

  onScopeDispose(clear);

  return { dimmed: readonly(dimmed) };
};
