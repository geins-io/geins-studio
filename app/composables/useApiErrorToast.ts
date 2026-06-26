/**
 * Suppression seam for the global API error toast.
 *
 * The global error toast is emitted once, centrally, from `$geinsApi`'s
 * `onResponseError` (see `plugins/geins-api.ts`). A few flows perform API
 * mutations that must fail *silently* — e.g. an automatic re-save on page load
 * — where a "Something went wrong" toast would be alarming and wrong. Those
 * flows wrap the call in `withSuppressedErrorToast` so the central handler
 * skips the toast while it runs (the error still propagates to the caller).
 *
 * Module-scoped depth counter so it is a single shared singleton across the
 * app and supports nesting.
 */
import type { GeinsApiError, GeinsErrorContext } from '#shared/types';

const suppressDepth = ref(0);

interface UseApiErrorToastReturnType {
  /** True while a suppressed call is in flight — checked by the global handler. */
  isSuppressed: () => boolean;
  /** Run `fn` with the global error toast suppressed, releasing on settle. */
  withSuppressedErrorToast: <T>(fn: () => Promise<T>) => Promise<T>;
  /** Emit the single, global API error toast. Owned by `$geinsApi`. */
  showGlobalErrorToast: (
    error: GeinsApiError,
    data: Record<string, unknown>,
    context?: GeinsErrorContext,
  ) => Promise<void>;
}

export function useApiErrorToast(): UseApiErrorToastReturnType {
  const isSuppressed = () => suppressDepth.value > 0;

  const withSuppressedErrorToast = async <T>(
    fn: () => Promise<T>,
  ): Promise<T> => {
    suppressDepth.value++;
    try {
      return await fn();
    } finally {
      suppressDepth.value = Math.max(0, suppressDepth.value - 1);
    }
  };

  // The single, global owner of API error toasts. Surfaces the backend
  // `data.title` (e.g. "Market not found: 1") via getApiErrorTitle, falling
  // back to a status-based message. Lives here rather than in the geins-api
  // plugin so the plugin doesn't pull NuxtApp/$i18n into its type graph (which
  // tips Nitro's $fetch route-type resolution over the excessive stack depth
  // limit). useToast is imported dynamically for the same reason.
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

    // Title uses the action+entity sentence from errorContext (e.g.
    // "Something went wrong while sending quotation"), falling back to the
    // generic feedback_error. The entity is a raw i18n key — `error_{action}_entity`
    // resolves it via `@.lower:{entityName}`, keeping correct grammar per locale.
    const contextMessage = context
      ? i18n.t(`error_${context.action}_entity`, { entityName: context.entity })
      : undefined;

    toast({
      title: contextMessage || i18n.t('feedback_error'),
      description:
        getApiErrorTitle(error) || getFallbackErrorMessage(error.status, data),
      variant: 'negative',
    });
  };

  return { isSuppressed, withSuppressedErrorToast, showGlobalErrorToast };
}
