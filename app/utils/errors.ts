/**
 * Utility function to standardize error handling
 * @param error Any caught error
 * @returns Normalized error message as string
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    if ('message' in error) {
      return (error as { message: string }).message;
    }
    if ('error' in error) {
      return (error as { error: string }).error;
    }
  }

  return JSON.stringify(error);
}

export function getErrorStatus(error: unknown): number {
  if (error && typeof error === 'object') {
    if ('status' in error) {
      return (error as { status: number }).status;
    }
    if ('statusCode' in error) {
      return (error as { statusCode: number }).statusCode;
    }
    if ('code' in error) {
      return (error as { code: number }).code;
    }
    if ('response' in error) {
      const response = (error as { response: { status: number } }).response;
      if (response && 'status' in response) {
        return (response as { status: number }).status;
      }
    }
  }
  if (error && typeof error === 'number') {
    return error;
  }
  if (error && typeof error === 'string') {
    const parsedError = JSON.parse(error);
    if (parsedError && 'status' in parsedError) {
      return (parsedError as { status: number }).status;
    }
  }
  return 0;
}

// Helper function to get appropriate error messages
export function getFallbackErrorMessage(
  status: number,
  data: Record<string, unknown> | null,
): string {
  // Extract meaningful message from response data if possible
  const msg = data?.message || data?.error || null;
  const serverMessage = typeof msg === 'string' ? msg : null;

  const statusMessages: Record<number, string> = {
    400: 'Bad request',
    401: 'Authentication required',
    403: 'Insufficient permissions',
    404: 'Resource not found',
    408: 'Request timeout',
    409: 'Resource conflict',
    429: 'Too many requests',
    500: 'Server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout',
  };

  return serverMessage || statusMessages[status] || 'Unknown error';
}

export function getErrorType(status: number): GeinsErrorType {
  if (status === 401) return 'AUTH_ERROR';
  if (status === 403) return 'PERMISSION_ERROR';
  if (status === 404) return 'NOT_FOUND_ERROR';
  if (status === 429) return 'RATE_LIMIT_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'API_ERROR';
}
