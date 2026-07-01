/**
 * Owner of the single, global API error toast.
 *
 * `$geinsApi`'s `onRequestError` / `onResponseError` (see `plugins/geins-api.ts`)
 * call `showGlobalErrorToast` once per failed mutation. A call opts out per
 * request via the `suppressErrorToast` fetch option (see
 * `shared/types/ofetch.d.ts`), checked in the plugin — not here.
 */
import type { GeinsApiError, GeinsErrorContext } from '#shared/types';

interface UseApiErrorToastReturnType {
  /** Emit the single, global API error toast. Owned by `$geinsApi`. */
  showGlobalErrorToast: (
    error: GeinsApiError,
    data: Record<string, unknown>,
    context?: GeinsErrorContext,
  ) => Promise<void>;
}

export function useApiErrorToast(): UseApiErrorToastReturnType {
  // Lives here rather than in the geins-api plugin so the plugin doesn't pull
  // NuxtApp/$i18n into its type graph (which tips Nitro's $fetch route-type
  // resolution over the excessive stack depth limit). useToast is imported
  // dynamically for the same reason.
  const showGlobalErrorToast = async (
    error: GeinsApiError,
    data: Record<string, unknown>,
    context?: GeinsErrorContext,
  ): Promise<void> => {
    const nuxtApp = useNuxtApp();
    const i18n = nuxtApp.$i18n as {
      t: (key: string, named?: Record<string, unknown>) => string;
    };
    const { useToast } = await import('@/components/ui/toast/use-toast');
    const { toast } = useToast();

    // `entity` is a raw i18n key so `error_{action}_entity` can resolve it via
    // `@.lower:{entityName}` with correct per-locale grammar.
    const contextMessage = context
      ? i18n.t(`error_${context.action}_entity`, { entityName: context.entity })
      : undefined;

    toast({
      title: contextMessage || i18n.t('feedback_error'),
      description:
        composeErrorMessage(
          getApiErrorTitle(error),
          getApiErrorDetail(error),
        ) || getFallbackErrorMessage(error.status, data),
      variant: 'negative',
    });
  };

  return { showGlobalErrorToast };
}
