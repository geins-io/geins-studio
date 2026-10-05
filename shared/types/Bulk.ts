import type { Component } from 'vue';

/** Per-call fetch options a bulk run hands each chunk's request. */
export interface BulkRunFetchOptions {
  suppressErrorToast?: boolean;
}

/** Ids split by outcome after a chunked bulk run. */
export interface BulkRunResult {
  succeeded: string[];
  failed: string[];
  /** One entry per failed chunk, in run order. */
  errors: unknown[];
  /** What each successful chunk's call resolved to, in run order. */
  responses: unknown[];
}

/**
 * One action in a bulk action sheet. Method signatures (not arrow properties)
 * keep `BulkAction<string[]>` assignable to `BulkAction` in an actions list.
 */
export interface BulkAction<TValue = unknown> {
  key: string;
  /** Translated label for the action list and the confirm step. */
  label: string;
  /** Lucide icon name, resolved with `useLucideIcon`. */
  icon: string;
  /**
   * Properties pane, bound with `v-model` to the action's value. Omit when the
   * action takes no input. A `string` is accepted because `resolveComponent`
   * can return the name when unresolved.
   */
  component?: Component | string;
  componentProps?: Record<string, unknown>;
  /** Fresh value each time the action is picked. */
  initialValue?(): TValue;
  /** Run stays disabled until this passes. Defaults to valid. */
  isValid?(value: TValue): boolean;
  /** What the confirm step shows about the value. Defaults to the label. */
  summary?(value: TValue): string;
  /** Extra line under the summary, e.g. whether the change can be undone. */
  note?(value: TValue): string | undefined;
  /** Destructive styling on the confirm button. */
  destructive?: boolean;
  /**
   * Friendly reason for a refused call. When set, the global API error toast is
   * silenced for every chunk and the runner toasts this instead.
   */
  describeError?(error: unknown): string | undefined;
  /** One chunk's request. Let errors propagate. */
  run(
    ids: string[],
    value: TValue,
    options: BulkRunFetchOptions,
  ): Promise<unknown>;
  /** Success toast title for `count` ids; `responses` are the chunks' results. */
  successMessage(count: number, responses: unknown[]): string;
}
