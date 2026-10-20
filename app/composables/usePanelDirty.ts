import type { MaybeRefOrGetter } from 'vue';

export interface UsePanelDirtyReturnType {
  /** True only once a real change is made after the baseline is captured. */
  isDirty: ComputedRef<boolean>;
  /** Re-baseline to the current values — call on open, after `resetForm`. */
  captureBaseline: () => void;
}

// Deterministic JSON: sort object keys recursively so key order never reads as
// a change. Arrays keep their order (that's real data), but their object
// elements are normalized too.
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortKeys(record[key])]),
    );
  }
  return value;
}
function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/**
 * Robust dirty state for slide-in panels (fed to `PanelEdit`'s `:dirty`), the
 * panel counterpart to {@link useUnsavedChanges} (which is route-guard based,
 * for full pages).
 *
 * vee-validate's `form.meta.value.dirty` false-positives on open: fields that
 * start `undefined` in the reset values settle to `''` / `[]` / `false` on
 * mount, and child inputs (reka `Combobox` / `TagsInput`) emit a normalized
 * value AFTER mount — all of which flip `meta.dirty` with no user edit and trip
 * the unsaved-changes guard on close.
 *
 * This compares a normalized JSON snapshot of the form values against a baseline
 * captured **after the inputs settle** (`nextTick`), so only genuine edits read
 * as dirty. Pass a getter for the form values (e.g. `() => form.values`) and
 * call `captureBaseline()` in the panel's open watcher, after `resetForm`.
 */
export function usePanelDirty(
  values: MaybeRefOrGetter<unknown>,
): UsePanelDirtyReturnType {
  const baseline = ref<string | null>(null);
  const serialize = () => stableStringify(toValue(values));

  const isDirty = computed(
    () => baseline.value !== null && serialize() !== baseline.value,
  );

  async function captureBaseline() {
    // Not dirty while (re)baselining; settle child mount emits first.
    baseline.value = null;
    await nextTick();
    baseline.value = serialize();
  }

  return { isDirty, captureBaseline };
}
