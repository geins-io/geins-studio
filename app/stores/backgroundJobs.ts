import { defineStore } from 'pinia';
import type {
  BackgroundJob,
  BackgroundJobProgress,
  BackgroundJobStart,
  BackgroundJobState,
} from '#shared/types';

const STORAGE_PREFIX = 'geins-background-jobs:';

/** A pending job older than this isn't resumed after a reload. */
export const BACKGROUND_JOB_RESUME_MS = 15 * 60 * 1_000;

/** How long a finished job stays in the panel. */
export const BACKGROUND_JOB_KEEP_MS = 2 * 60 * 1_000;

/**
 * Background jobs — media calls that succeed at once but land later. Pending
 * jobs are kept in `localStorage` per account, so a reload or a second tab
 * resumes them. `useBackgroundJobRunner` polls them; this store only holds
 * state.
 */
export const useBackgroundJobsStore = defineStore('background-jobs', () => {
  const { session } = useGeinsAuth();

  const jobs = ref<BackgroundJob[]>([]);
  const panelOpen = ref(false);
  /** Bare file URL → when its replace landed; busts preview caches. */
  const fileVersions = ref<Record<string, number>>({});

  const bareUrl = (url: string) => url.replace(/\?.*$/, '');
  const fileVersion = (url: string | null | undefined): number | undefined =>
    url ? fileVersions.value[bareUrl(url)] : undefined;
  function markFileReplaced(url: string, at: number = Date.now()): void {
    fileVersions.value[bareUrl(url)] = at;
  }

  const pending = computed(() =>
    jobs.value.filter((job) => job.state === 'pending'),
  );
  const hasFinished = computed(() => pending.value.length < jobs.value.length);
  /** Assets a pending move holds — replace answers `409` on them meanwhile. */
  const movingAssetIds = computed(
    () =>
      new Set(
        pending.value.flatMap((job) =>
          job.spec.kind === 'move' ? (job.spec.assetIds ?? []) : [],
        ),
      ),
  );
  /** Folders a pending rename/move holds — their subtree's paths are moving. */
  const movingFolderIds = computed(
    () =>
      new Set(
        pending.value.flatMap((job) =>
          job.spec.kind === 'move' ? (job.spec.folderIds ?? []) : [],
        ),
      ),
  );
  const storageKey = computed(() =>
    session.value?.accountKey
      ? `${STORAGE_PREFIX}${session.value.accountKey}`
      : null,
  );

  // Storage can be blocked or full; then jobs just don't survive a reload.
  // Another tab shares the key, so its pending jobs (ids unknown here) are
  // kept on write rather than overwritten.
  function persist(now: number = Date.now()): void {
    const key = storageKey.value;
    if (!key) return;
    try {
      const known = new Set(jobs.value.map((job) => job.id));
      const others = readStored(key).filter(
        (job) =>
          job?.state === 'pending' &&
          !known.has(job.id) &&
          now - job.startedAt < BACKGROUND_JOB_RESUME_MS,
      );
      const next = [...others, ...pending.value];
      if (next.length) {
        localStorage.setItem(key, JSON.stringify(next));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // Not persisted — the in-memory job still runs.
    }
  }

  function readStored(key: string): BackgroundJob[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** Bring back this account's pending jobs that are young enough to resume. */
  function restore(now: number = Date.now()): void {
    const key = storageKey.value;
    if (!key) return;
    const known = new Set(jobs.value.map((job) => job.id));
    for (const job of readStored(key)) {
      if (
        job?.state === 'pending' &&
        now - job.startedAt < BACKGROUND_JOB_RESUME_MS &&
        !known.has(job.id)
      ) {
        jobs.value.push(job);
      }
    }
    persist(now);
  }

  function add(start: BackgroundJobStart): BackgroundJob {
    const job: BackgroundJob = {
      ...start,
      id: crypto.randomUUID(),
      state: 'pending',
      startedAt: Date.now(),
    };
    jobs.value.push(job);
    persist();
    return job;
  }

  function update(
    id: string,
    patch: { state?: BackgroundJobState; progress?: BackgroundJobProgress },
  ): void {
    const job = jobs.value.find((j) => j.id === id);
    if (!job) return;
    Object.assign(job, patch);
    if (patch.state && patch.state !== 'pending') job.finishedAt = Date.now();
    persist();
  }

  // The trigger unmounts with the last row, so close the panel deliberately.
  function clearFinished(): void {
    jobs.value = pending.value;
    if (!jobs.value.length) panelOpen.value = false;
  }

  /**
   * Drop rows finished more than `BACKGROUND_JOB_KEEP_MS` ago — never while
   * the panel is open, so a row doesn't vanish under the user.
   */
  function expireFinished(now: number = Date.now()): void {
    if (panelOpen.value) return;
    jobs.value = jobs.value.filter(
      (job) =>
        job.state === 'pending' ||
        now - (job.finishedAt ?? now) < BACKGROUND_JOB_KEEP_MS,
    );
  }

  /** Forget the in-memory jobs (sign-out, account switch); storage is kept. */
  function reset(): void {
    jobs.value = [];
    panelOpen.value = false;
  }

  return {
    jobs,
    pending,
    hasFinished,
    movingAssetIds,
    movingFolderIds,
    panelOpen,
    storageKey,
    fileVersions,
    fileVersion,
    markFileReplaced,
    restore,
    add,
    update,
    clearFinished,
    expireFinished,
    reset,
  };
});
