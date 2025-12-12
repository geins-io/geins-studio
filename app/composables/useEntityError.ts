import type { NuxtError } from '#app';

/**
 * Composable for handling errors in entity pages, particularly for 404 scenarios
 * when entities are not found or don't exist.
 *
 * @param entityName - The name of the entity being edited/viewed
 * @returns Object with error handling utilities
 */
export function useEntityError(entityName?: string) {
  /**
   * Throws a 404 error with appropriate messaging for entity not found scenarios
   *
   * @param customMessage - Optional custom error message
   * @param statusCode - HTTP status code (defaults to 404)
   */
  const throwEntityError = (
    statusCode: number = 404,
    customMessage?: string,
  ): never => {
    const { t } = useI18n();
    const name = entityName || 'entity';

    let message: string;
    if (customMessage) {
      message = customMessage;
    } else if (statusCode === 404) {
      message = t('entity_not_found', { entityName: name });
    } else if (statusCode >= 500) {
      message = t('server_error_loading_entity', { entityName: name });
    } else {
      message = t('error_loading_entity', { entityName: name });
    }

    throw createError({
      statusCode,
      statusMessage: message,
      fatal: true,
    });
  };

  /**
   * Handles async data errors from entity fetching
   *
   * @param error - The error from useAsyncData
   * @param entityId - Optional entity ID for more specific error messages
   */
  const handleFetchError = (error: any, entityId?: string): void => {
    const { t } = useI18n();
    const name = entityName || 'entity';

    // Check if it's a 404 error
    if (error?.statusCode === 404) {
      throwEntityError(
        404,
        entityId
          ? t('entity_with_id_not_found', {
              entityName: name,
              id: entityId,
            })
          : undefined,
      );
    }

    // Check if it's a server error (5xx)
    if (error?.statusCode && error.statusCode >= 500) {
      throwEntityError(500);
    }

    // Generic error
    throwEntityError(500, error?.message);
  };

  /**
   * Shows a toast notification for non-fatal errors
   *
   * @param error - The error object
   * @param customMessage - Optional custom error message
   */
  const showEntityErrorToast = async (
    error: any,
    customMessage?: string,
  ): Promise<void> => {
    const { useToast } = await import('@/components/ui/toast/use-toast');
    const { toast } = useToast();
    const { t } = useI18n();
    const name = entityName || 'entity';

    toast({
      title: customMessage || t('error_loading_entity', { entityName: name }),
      description: error?.message || t('feedback_error_description'),
      variant: 'negative',
    });
  };

  /**
   * Checks if data is valid (not null/undefined) and throws error if invalid
   *
   * @param data - The data to validate
   * @param entityId - Optional entity ID for error messages
   */
  const validateEntityData = <T>(
    data: T | null | undefined,
    entityId?: string,
  ): NonNullable<T> => {
    if (!data) {
      throwEntityError(
        404,
        entityId ? `Entity with ID ${entityId} not found` : undefined,
      );
    }
    return data as NonNullable<T>;
  };

  return {
    throwEntityError,
    handleFetchError,
    showEntityErrorToast,
    validateEntityData,
  };
}
