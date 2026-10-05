import type { BulkAction, BulkRunResult } from '#shared/types';
import { chunkIds, runInChunks } from '#shared/utils/bulk';
import { useToast } from '@/components/ui/toast/use-toast';

export interface UseBulkRunnerReturnType {
  /** Run `action` over `ids` in chunks of 100, toast the outcome, return it. */
  run: <TValue>(
    action: BulkAction<TValue>,
    ids: string[],
    value: TValue,
    entityKey: string,
  ) => Promise<BulkRunResult>;
}

/**
 * Chunked runner for bulk actions. A single chunk leaves a failure to the global
 * API error toast; several chunks silence it per call and give one summary
 * toast ("X of N updated") instead, so a long run can't stack a toast per chunk.
 * An action with `describeError` always owns its failure toast.
 */
export function useBulkRunner(): UseBulkRunnerReturnType {
  const { t } = useI18n();
  const { toast } = useToast();
  const { geinsLogError } = useGeinsLog('composables/useBulkRunner');

  async function run<TValue>(
    action: BulkAction<TValue>,
    ids: string[],
    value: TValue,
    entityKey: string,
  ): Promise<BulkRunResult> {
    const multi = chunkIds(ids).length > 1;
    const ownsErrors = !!action.describeError;
    const options = multi || ownsErrors ? { suppressErrorToast: true } : {};
    const result = await runInChunks(ids, (chunk) =>
      action.run(chunk, value, options),
    );
    const total = result.succeeded.length + result.failed.length;

    for (const error of result.errors) {
      geinsLogError(action.key, getErrorMessage(error));
    }

    if (!result.failed.length) {
      toast({
        title: action.successMessage(total, result.responses),
        variant: 'positive',
      });
    } else if (multi || ownsErrors) {
      // Never the detail: the bulk routes list the refused ids there.
      const firstError = result.errors[0];
      const reason =
        action.describeError?.(firstError) ?? getApiErrorTitle(firstError);
      toast({
        title: multi
          ? t(
              'bulk_action_partial',
              { succeeded: result.succeeded.length, total, entityKey },
              total,
            )
          : t('bulk_action_failed'),
        description: multi
          ? composeErrorMessage(reason, t('bulk_action_failed_kept'))
          : reason,
        variant: 'negative',
      });
    }
    return result;
  }

  return { run };
}
