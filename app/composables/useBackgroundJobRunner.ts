import type { BackgroundJob } from '#shared/types';
import {
  backgroundJobCheck,
  SETTLE_FIRST_DELAY_MS,
  SETTLE_MAX_WAIT_MS,
  settleJob,
} from '#shared/utils/job';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Polls every pending background job until it settles — mount it once, in the
 * header (`LayoutBackgroundJobs`), so jobs outlive the dialog that started
 * them. On done it refreshes the job's `refreshKeys` (only mounted reads
 * refetch, so the page the user is on updates) and toasts the success copy;
 * skipped files or a timeout toast a warning instead. It also resumes the
 * account's stored jobs, drops them on an account switch, and expires
 * finished rows after `BACKGROUND_JOB_KEEP_MS`.
 */
export function useBackgroundJobRunner(): void {
  const { t } = useI18n();
  const { toast } = useToast();
  const { assetApi } = useGeinsRepository();
  const { geinsLogWarn } = useGeinsLog('composables/useBackgroundJobRunner');
  const store = useBackgroundJobsStore();
  const { pending, storageKey, hasFinished } = storeToRefs(store);
  const { message } = useBackgroundJobs();
  const running = new Map<string, AbortController>();

  async function run(job: BackgroundJob): Promise<void> {
    const controller = new AbortController();
    running.set(job.id, controller);
    const check = backgroundJobCheck(job.spec, assetApi, {
      startedAt: job.startedAt,
    });
    // A resumed job only gets what's left of the limit, but at least one check.
    const maxWaitMs = Math.max(
      SETTLE_MAX_WAIT_MS - (Date.now() - job.startedAt),
      SETTLE_FIRST_DELAY_MS,
    );
    const outcome = await settleJob(
      async () => {
        const result = await check();
        if (result.result) store.update(job.id, { progress: result.result });
        return result;
      },
      { signal: controller.signal, maxWaitMs },
    );
    running.delete(job.id);
    if (outcome.state === 'aborted') return;

    store.update(job.id, { state: outcome.state });
    if (
      outcome.state === 'completed' &&
      job.spec.kind === 'replace' &&
      job.spec.url
    ) {
      store.markFileReplaced(job.spec.url);
    }
    await refreshNuxtData(job.refreshKeys).catch((error) =>
      geinsLogWarn('refresh after job failed', error),
    );
    const skipped = outcome.result ? outcome.result.skipped : 0;
    if (outcome.state === 'timeout') {
      toast({
        title: message(job.label),
        description: t('background_jobs.timeout'),
        variant: 'warning',
      });
    } else if (skipped) {
      toast({
        title: message(job.doneMessage),
        description: t('background_jobs.skipped', { count: skipped }, skipped),
        variant: 'warning',
      });
    } else {
      toast({
        title: message(job.doneMessage),
        description: job.doneDescription && message(job.doneDescription),
        variant: 'positive',
      });
    }
  }

  function abortAll(): void {
    for (const controller of running.values()) controller.abort();
    running.clear();
  }

  watch(
    storageKey,
    (key, previous) => {
      if (previous && key !== previous) {
        abortAll();
        store.reset();
      }
      store.restore();
    },
    { immediate: true },
  );

  watch(
    () => pending.value.map((job) => job.id),
    () => {
      for (const job of pending.value) {
        if (!running.has(job.id)) void run(job);
      }
    },
    { immediate: true },
  );

  usePollWhile(hasFinished, () => store.expireFinished(), 10_000);

  onScopeDispose(abortAll);
}
