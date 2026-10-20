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

/** How the confirm step shows an action's value. */
export type BulkConfirmSummary =
  /** One pill per value, e.g. the tags being added. */
  | { tags: string[] }
  /** A trail from the root, e.g. the destination folder. */
  | { path: string[]; icon?: string }
  /** A short bullet list, e.g. the link count and how the links are made. */
  | { list: string[] };

/** A consequence the confirm step calls out, e.g. URLs that change. */
export interface BulkConfirmWarning {
  title: string;
  description: string;
}

/**
 * One action in a bulk action sheet. Method signatures (not arrow properties)
 * keep `BulkAction<string[]>` assignable to `BulkAction` in an actions list.
 */
export interface BulkAction<TValue = unknown> {
  key: string;
  /** Translated label for the action list and the confirm button. */
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
  /**
   * The confirm step's question for `count` items, e.g. "Add 2 tags to 63
   * assets?". Without it the confirm falls back to a generic title + line.
   */
  confirmTitle?(count: number, value: TValue): string;
  /** What the confirm step shows about the value. Omit when the title says it. */
  summary?(value: TValue): BulkConfirmSummary | undefined;
  /** A consequence the confirm step calls out above the note. */
  warning?(value: TValue): BulkConfirmWarning | undefined;
  /** Muted line under the summary, e.g. whether the change can be undone. */
  note?(value: TValue): string | undefined;
  /**
   * Properties-pane line for an action with no `component`, saying what Run
   * will do to `count` items. Defaults to a generic "no properties" line.
   */
  description?(count: number): string;
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
  /**
   * Start a background job for work that lands after the calls (e.g. a move's
   * copies). Return `true` when one started: its "started" toast then stands
   * in for the success toast, which comes once the job lands. `ids` are the
   * ones whose chunk went through.
   */
  startJob?(count: number, responses: unknown[], ids: string[]): boolean;
}
