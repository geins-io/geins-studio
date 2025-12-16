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
  /**
   * Whether the error is related to a list of entities (affects messaging)
   */
  entityList?: boolean;
  /**
   * Optional scope for more specific error context
   */
  scope?: string;
}

interface UsePageErrorReturnType {
  throwPageError: (
    statusCodeOrError: number | NuxtError,
    contextOptions?: PageErrorOptions,
  ) => never;
  showErrorToast: (
    customTitle?: string,
    customDescription?: string,
  ) => Promise<void>;
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

  const { geinsLogError } = useGeinsLog(
    options?.scope || 'composables/usePageError.ts',
  );

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
    const pluralizerNr = effectiveOptions?.entityList ? 2 : 1;

    if (statusCode === 404) {
      if (entityName && entityId) {
        return t('entity_with_id_not_found', {
          entityName,
          id: entityId,
        });
      }
      if (entityName) {
        return t('no_entity_found', { entityName }, pluralizerNr);
      }
      return t('error.404_description');
    }

    if (statusCode >= 500) {
      if (entityName) {
        return t('error_loading_entity', { entityName: name }, pluralizerNr);
      }
      return t('error.500_description');
    }

    if (entityName) {
      return t('error_loading_entity', { entityName: name }, pluralizerNr);
    }
    return t('error.500_description');
  };

  /**
   * Throws a page error with appropriate messaging
   * Can accept either a status code or an error object
   *
   * @param statusCodeOrError - HTTP status code or error object
   * @param customTitle - Optional custom error message
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

    geinsLogError(`error ${statusCode} ::: ${finalMessage}`);

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
   * @param customTitle - Optional custom error message
   */
  const showErrorToast = async (
    customTitle?: string,
    customDescription?: string,
  ): Promise<void> => {
    const { useToast } = await import('@/components/ui/toast/use-toast');
    const { toast } = useToast();

    const title = customTitle || t('feedback_error');
    const description = customDescription || t('feedback_error_description');

    toast({
      title,
      description,
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
