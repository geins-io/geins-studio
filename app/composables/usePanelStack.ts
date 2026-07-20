import type { ComputedRef, Ref } from 'vue';

/**
 * Tracks the global open order of stacking panels so a base panel knows when
 * another has opened on top of it (panel-on-panel).
 *
 * The crux of the focus-trap fix lives in the consumer (`PanelEdit`): only the
 * TOP panel is rendered `modal`, so exactly one Reka `FocusScope` traps at a
 * time and Reka's `hideOthers` marks every lower panel inert. Without this,
 * nested trapped FocusScopes fight and a `MutationObserver` yanks focus to the
 * panel start — the reason an inline combobox in a stacked panel loses focus.
 *
 * Order = open order; the last id in the stack is the top. Only panels that
 * call this participate, so unrelated Sheets elsewhere are unaffected.
 */
const stack = ref<symbol[]>([]);

export interface UsePanelStackReturn {
  /** This panel is the top-most open panel (should be modal + interactive). */
  isTop: ComputedRef<boolean>;
  /** Another panel opened above this one (should recede + go inert). */
  hasPanelAbove: ComputedRef<boolean>;
  /** 0-based position from the bottom of the stack (-1 when closed). */
  index: ComputedRef<number>;
}

export function usePanelStack(
  open: Ref<boolean | undefined>,
): UsePanelStackReturn {
  const id = Symbol('panel');

  const remove = () => {
    stack.value = stack.value.filter((entry) => entry !== id);
  };

  watch(
    open,
    (value) => {
      if (value) {
        if (!stack.value.includes(id)) stack.value = [...stack.value, id];
      } else {
        remove();
      }
    },
    { immediate: true },
  );

  // Guard against a panel unmounting while still open (route change, v-if).
  onScopeDispose(remove);

  const index = computed(() => stack.value.indexOf(id));
  const isTop = computed(
    () => index.value !== -1 && index.value === stack.value.length - 1,
  );
  const hasPanelAbove = computed(
    () => index.value !== -1 && index.value < stack.value.length - 1,
  );

  return { isTop, hasPanelAbove, index };
}
