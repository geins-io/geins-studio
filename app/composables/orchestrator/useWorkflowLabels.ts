interface UseWorkflowLabelsReturnType {
  triggerTypeLabel: (type: string | null | undefined) => string;
  logVerbosityLabel: (value: string | null | undefined) => string;
  errorHandlingLabel: (value: string | null | undefined) => string;
  timeoutBehaviorLabel: (value: string | null | undefined) => string;
}

/**
 * Single source of truth for workflow enum value → i18n label.
 *
 * The Management API and the form schema use machine values (`OnDemand`,
 * `continueOnError`, `detailed`) for trigger types and runtime settings. They
 * must render through the same i18n keys everywhere — the General/Settings
 * selects, the edit-page summary sidebar, and the workflows list table — so a
 * trigger never shows as raw `OnDemand` in one place and `On demand` in another.
 *
 * Keys are matched case-/separator-insensitively (`OnDemand`, `onDemand`,
 * `On Demand` all normalize to `ondemand`); unknown values fall back to the
 * raw string.
 */
const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const TRIGGER_TYPE_KEYS: Record<string, string> = {
  ondemand: 'workflows.on_demand',
  scheduled: 'workflows.scheduled',
  event: 'workflows.event',
};

const LOG_VERBOSITY_KEYS: Record<string, string> = {
  minimal: 'workflows.verbosity_minimal',
  normal: 'workflows.verbosity_normal',
  detailed: 'workflows.verbosity_detailed',
};

const ERROR_HANDLING_KEYS: Record<string, string> = {
  failfast: 'workflows.error_fail_fast',
  continueonerror: 'workflows.error_continue',
  retry: 'workflows.error_retry',
};

const TIMEOUT_BEHAVIOR_KEYS: Record<string, string> = {
  fail: 'workflows.timeout_fail',
  continue: 'workflows.timeout_continue',
  cancel: 'workflows.timeout_cancel',
};

export const useWorkflowLabels = (): UseWorkflowLabelsReturnType => {
  const { t } = useI18n();

  const resolve =
    (map: Record<string, string>) =>
    (value: string | null | undefined): string => {
      const key = map[normalize(value)];
      return key ? t(key) : String(value ?? '');
    };

  return {
    triggerTypeLabel: resolve(TRIGGER_TYPE_KEYS),
    logVerbosityLabel: resolve(LOG_VERBOSITY_KEYS),
    errorHandlingLabel: resolve(ERROR_HANDLING_KEYS),
    timeoutBehaviorLabel: resolve(TIMEOUT_BEHAVIOR_KEYS),
  };
};
