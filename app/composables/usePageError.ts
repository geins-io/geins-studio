import type { NuxtError } from '#app';

interface PageErrorOptions {
  /**
   * The name of the entity being edited/viewed (for entity-specific errors)
   */
  entityName?: string;
  /**
   * The ID of the entity (for more specific error messages)
   */
  entityId?: string;
}

interface UsePageErrorReturnType {
  throwPageError: (
    statusCodeOrError: number | NuxtError,
    contextOptions?: PageErrorOptions,
  ) => never;
  showErrorToast: (error: any, customMessage?: string) => Promise<void>;
  validateData: <T>(
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ) => NonNullable<T>;
  handleFetchResult: <T>(
    error: NuxtError | undefined,
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ) => NonNullable<T>;
}

/**
 * Composable for handling errors in any page, with optional support for entity-specific errors
 *
 * @param options - Default options for error context
 * @returns {UsePageErrorReturnType} - An object containing error handling utilities
 */
export function usePageError(
  options: PageErrorOptions = {},
): UsePageErrorReturnType {
  const { t } = useI18n();

  /**
   * Gets the appropriate error message based on context and status code
   */
  const getErrorMessage = (
    statusCode: number,
    contextOptions: PageErrorOptions = {},
  ): string => {
    const effectiveOptions = { ...options, ...contextOptions };
    const { entityName, entityId } = effectiveOptions;
    const name = entityName || 'entity';

    if (statusCode === 404) {
      if (entityName && entityId) {
        return t('entity_with_id_not_found', {
          entityName,
          id: entityId,
        });
      }
      if (entityName) {
        return t('no_entity_found', { entityName });
      }
      return t('error.404_description');
    }

    if (statusCode >= 500) {
      if (entityName) {
        return t('error_loading_entity', { entityName: name });
      }
      return t('error.500_description');
    }

    if (entityName) {
      return t('error_loading_entity', { entityName: name });
    }
    return t('error.500_description');
  };

  /**
   * Throws a page error with appropriate messaging
   * Can accept either a status code or an error object
   *
   * @param statusCodeOrError - HTTP status code or error object
   * @param customMessage - Optional custom error message
   * @param contextOptions - Optional override for error context
   */
  const throwPageError = (
    statusCodeOrError: number | NuxtError = 404,
    contextOptions?: PageErrorOptions,
  ): never => {
    let statusCode: number;

    // Handle error object
    if (typeof statusCodeOrError === 'object' && statusCodeOrError !== null) {
      statusCode = statusCodeOrError.statusCode || 500;
    } else {
      statusCode = statusCodeOrError;
    }

    const finalMessage = getErrorMessage(statusCode, contextOptions);

    throw createError({
      statusCode,
      statusMessage: finalMessage,
      fatal: true,
    });
  };

  /**
   * Shows a toast notification for non-fatal errors
   *
   * @param error - The error object
   * @param customMessage - Optional custom error message
   */
  const showErrorToast = async (
    error: any,
    customMessage?: string,
  ): Promise<void> => {
    const { useToast } = await import('@/components/ui/toast/use-toast');
    const { toast } = useToast();

    const { entityName } = options;
    const name = entityName || 'page';

    const title =
      customMessage ||
      (entityName
        ? t('error_loading_entity', { entityName: name })
        : t('error_loading_page'));

    toast({
      title,
      description: error?.message || t('feedback_error_description'),
      variant: 'negative',
    });
  };

  /**
   * Checks if data is valid (not null/undefined) and throws error if invalid
   *
   * @param data - The data to validate
   * @param customOptions - Optional override for error context
   */
  const validateData = <T>(
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ): NonNullable<T> => {
    if (!data) {
      throwPageError(404, customOptions);
    }
    return data as NonNullable<T>;
  };

  const handleFetchResult = <T>(
    error: NuxtError | undefined,
    data: T | null | undefined,
    customOptions?: PageErrorOptions,
  ): NonNullable<T> => {
    if (error) {
      throwPageError(error, customOptions);
    }
    return validateData(data, customOptions);
  };

  return {
    throwPageError,
    showErrorToast,
    validateData,
    handleFetchResult,
  };
}
