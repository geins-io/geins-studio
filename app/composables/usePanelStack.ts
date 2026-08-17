import type { ComponentPublicInstance, ComputedRef, Ref } from 'vue';

/**
 * Global open-order tracker for stacking panels (panel-on-panel), so a panel
 * opened while another is already open renders as a stacked (`inline`) slide-over
 * instead of its own modal sheet — no per-consumer wiring.
 *
 * The bottom (first-opened) panel is a modal Reka `Sheet` and registers a
 * teleport container inside its content (`registerTarget`). Stacked panels
 * `<Teleport>` into that container (`stackTarget`) so they live in the base's
 * modal subtree — Reka's `hideOthers` never hides them and its focus trap
 * reaches them. The base stays `modal` throughout (no content-swap remount).
 *
 * See PanelEdit for the consumer; docs/components/panel/PanelEdit.md.
 */
const stack = ref<symbol[]>([]);
// The bottom sheet's teleport container; stacked panels render into it.
const stackTarget = ref<HTMLElement | null>(null);

export interface UsePanelStackReturn {
  /** 0-based position from the bottom of the stack (-1 when closed). */
  index: ComputedRef<number>;
  /** This panel is the top-most open panel. */
  isTop: ComputedRef<boolean>;
  /** Another panel opened above this one (should recede + go inert). */
  hasPanelAbove: ComputedRef<boolean>;
  /** Latched at open: a panel was already open → render as a stacked inline panel. */
  isStacked: ComputedRef<boolean>;
  /** Shared teleport target — the bottom sheet's content container. */
  stackTarget: Ref<HTMLElement | null>;
  /** Bottom sheet registers its container (function ref: element on mount, null on unmount). */
  registerTarget: (el: Element | ComponentPublicInstance | null) => void;
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
  // Render as a stacked slide-over when open above the bottom, OR — while
  // closed — whenever another panel is open (pre-mount off-screen so the
  // open/close slide transition runs instead of mounting/unmounting).
  const isStacked = computed(() =>
    open.value ? index.value > 0 : stack.value.length > 0,
  );

  function registerTarget(el: Element | ComponentPublicInstance | null) {
    stackTarget.value = el instanceof HTMLElement ? el : null;
  }

  return {
    index,
    isTop,
    hasPanelAbove,
    isStacked,
    stackTarget,
    registerTarget,
  };
}
