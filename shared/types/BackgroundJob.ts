// =============================================================================
// Background jobs — media calls that succeed at once but land later. A job is
// plain JSON so it can be persisted and resumed after a reload.
// =============================================================================

/**
 * A translated message kept as key + params, so a resumed job renders in the
 * current locale.
 */
export interface JobMessage {
  key: string;
  params?: Record<string, string | number>;
  /** Plural count, passed as `t`'s third argument. */
  plural?: number;
}

/** What to poll — everything `backgroundJobCheck` needs to rebuild the check. */
export type BackgroundJobSpec =
  | {
      kind: 'move';
      /** One per bulk-move chunk; the job is done when every move is. */
      moveIds: string[];
    }
  | {
      kind: 'replace';
      url: string | null;
      /** The CDN's `ETag` read just before the replace (`cdnEtag`). */
      etagBefore: string | null;
    };

export type BackgroundJobState = 'pending' | 'completed' | 'timeout';

export interface BackgroundJobProgress {
  /** Items that settled (moved or skipped). */
  done: number;
  total: number;
  skipped: number;
}

export interface BackgroundJobStart {
  spec: BackgroundJobSpec;
  /** Row label and started toast, e.g. "Moving 40 assets". */
  label: JobMessage;
  /** Success toast once the job lands. */
  doneMessage: JobMessage;
  /** `useAsyncData` keys refreshed once the job lands. */
  refreshKeys: string[];
}

export interface BackgroundJob extends BackgroundJobStart {
  /** Client-side id; jobs aren't backend entities. */
  id: string;
  state: BackgroundJobState;
  startedAt: number;
  /** When it left `pending`; finished rows expire a while after. */
  finishedAt?: number;
  progress?: BackgroundJobProgress;
}
