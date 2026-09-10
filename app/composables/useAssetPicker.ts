import type { Asset, AssetPickerOptions } from '#shared/types';
import type { Ref } from 'vue';

/**
 * Imperative singleton service over the asset picker. One panel instance lives
 * app-wide ([AssetPickerHost](/components/asset/AssetPickerHost), mounted in
 * `app.vue`); every caller drives it through this shared module-level state.
 *
 * `open(options)` returns a promise that resolves with the chosen assets on
 * confirm, or `[]` on cancel/close (never rejects — callers don't need a
 * try/catch). Calling `open` again while the picker is already open is ignored:
 * the in-flight promise is returned and the current selection stays put.
 *
 * `confirm`/`cancel` are for the host to settle the pending promise; consumers
 * only call `open`. For the declarative sugar, wrap a trigger in
 * [`AssetPicker`](/components/asset/AssetPicker).
 */
const isOpen = ref(false);
// Last options passed to `open`. Kept (not cleared) when closed so the panel's
// props don't flicker to undefined during the close transition.
const options = ref<AssetPickerOptions>({});

// Not reactive — nothing renders off these; they only bridge open()'s promise
// to the host's confirm/cancel.
let resolver: ((assets: Asset[]) => void) | null = null;
let pending: Promise<Asset[]> | null = null;

export interface UseAssetPickerReturnType {
  /** The single host panel is open. */
  isOpen: Readonly<Ref<boolean>>;
  /** Options driving the currently open (or last opened) panel. */
  options: Readonly<Ref<AssetPickerOptions>>;
  /** Open the picker; resolves with the chosen assets, or `[]` on cancel/close. */
  open: (options?: AssetPickerOptions) => Promise<Asset[]>;
  /** Host-only: resolve the pending promise with the confirmed assets + close. */
  confirm: (assets: Asset[]) => void;
  /** Host-only: resolve the pending promise with `[]` (cancel) + close. */
  cancel: () => void;
}

export function useAssetPicker(): UseAssetPickerReturnType {
  function open(next: AssetPickerOptions = {}): Promise<Asset[]> {
    // Called again while open → return the in-flight promise, ignore new opts.
    if (isOpen.value && pending) return pending;
    options.value = next;
    isOpen.value = true;
    pending = new Promise<Asset[]>((resolve) => {
      resolver = resolve;
    });
    return pending;
  }

  function settle(assets: Asset[]) {
    resolver?.(assets);
    resolver = null;
    pending = null;
    isOpen.value = false;
  }

  function confirm(assets: Asset[]) {
    settle(assets);
  }

  function cancel() {
    // Guard the close-after-confirm case: confirm already settled, so a trailing
    // `update:open=false` must just close, not resolve a second (empty) time.
    if (resolver) settle([]);
    else isOpen.value = false;
  }

  return {
    isOpen: readonly(isOpen),
    // Shallow readonly (not `readonly()`, which would deep-freeze the arrays and
    // reject the panel's mutable `types`/`preselectedIds` props).
    options: options as Readonly<Ref<AssetPickerOptions>>,
    open,
    confirm,
    cancel,
  };
}
