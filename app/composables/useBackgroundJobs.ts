import type {
  BackgroundJob,
  BackgroundJobStart,
  JobMessage,
} from '#shared/types';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UseBackgroundJobsReturnType {
  jobs: Ref<BackgroundJob[]>;
  pending: ComputedRef<BackgroundJob[]>;
  hasFinished: ComputedRef<boolean>;
  /** Assets a pending move holds; replace is refused on them meanwhile. */
  movingAssetIds: ComputedRef<Set<string>>;
  panelOpen: Ref<boolean>;
  /** Track a job that was just accepted, and toast that it started. */
  start: (job: BackgroundJobStart) => BackgroundJob;
  /** Translate a stored `JobMessage`. */
  message: (msg: JobMessage) => string;
  clearFinished: () => void;
}

/**
 * Start and read background jobs. Starting one replaces the caller's success
 * toast with a neutral "started" toast whose action opens the header's jobs
 * panel; the success toast comes from `useBackgroundJobRunner` once the job
 * has really landed.
 */
export function useBackgroundJobs(): UseBackgroundJobsReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const store = useBackgroundJobsStore();
  const { jobs, pending, hasFinished, movingAssetIds, panelOpen } =
    storeToRefs(store);

  const message = (msg: JobMessage): string =>
    msg.plural === undefined
      ? t(msg.key, msg.params ?? {})
      : t(msg.key, msg.params ?? {}, msg.plural);

  function start(input: BackgroundJobStart): BackgroundJob {
    const job = store.add(input);
    toast({
      title: message(input.label),
      description: t('background_jobs.started'),
      action: () =>
        h(
          ToastAction,
          {
            altText: t('background_jobs.view_progress'),
            onClick: () => (panelOpen.value = true),
          },
          () => t('background_jobs.view_progress'),
        ),
    });
    return job;
  }

  return {
    jobs,
    pending,
    hasFinished,
    movingAssetIds,
    panelOpen,
    start,
    message,
    clearFinished: store.clearFinished,
  };
}
