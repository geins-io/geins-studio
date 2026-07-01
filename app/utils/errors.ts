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
  // Nitro createError wraps upstream body in `data` — may be a string or { message }
  const nested = data?.data;
  const nestedMsg =
    typeof nested === 'string'
      ? nested
      : nested && typeof nested === 'object' && 'message' in nested
        ? (nested as Record<string, unknown>).message
        : null;
  const msg =
    (typeof nestedMsg === 'string' ? nestedMsg : null) ||
    data?.message ||
    data?.error ||
    null;
  const serverMessage = typeof msg === 'string' ? msg : null;

  const statusMessages: Record<number, string> = {
    0: 'Network error — please check your connection',
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

// Pull a string field (`title` / `detail`) out of the two error shapes the app
// sees: a normalized GeinsApiError (`error.originalError.data.<field>`) and a
// raw ofetch FetchError (`error.data.<field>` or the Nitro-wrapped
// `error.data.data.<field>`).
function pickErrorField(
  error: unknown,
  field: 'title' | 'detail',
): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as Record<string, unknown>;

  const read = (data: unknown): string | undefined => {
    if (data && typeof data === 'object' && field in data) {
      const value = (data as Record<string, unknown>)[field];
      if (typeof value === 'string') return value;
    }
    return undefined;
  };

  const orig = err.originalError;
  if (orig && typeof orig === 'object') {
    const fromOrig = read((orig as Record<string, unknown>).data);
    if (fromOrig !== undefined) return fromOrig;
  }

  const outer = err.data;
  if (outer && typeof outer === 'object') {
    return read(outer) ?? read((outer as Record<string, unknown>).data);
  }

  return undefined;
}

export function getApiErrorTitle(error: unknown): string | undefined {
  return pickErrorField(error, 'title');
}

export function getApiErrorDetail(error: unknown): string | undefined {
  return pickErrorField(error, 'detail');
}

/**
 * Join a backend error title and detail into one string. The separator is
 * `'. '`, collapsing to a single space when the title already ends with a
 * period so there is no doubled or dangling dot. Falls back to whichever part
 * is present, or `undefined` when neither is.
 */
export function composeErrorMessage(
  title?: string,
  detail?: string,
): string | undefined {
  const head = title?.trim();
  const tail = detail?.trim();
  if (head && tail) {
    return `${head}${/\.$/.test(head) ? ' ' : '. '}${tail}`;
  }
  return head || tail || undefined;
}

export function getErrorType(status: number): GeinsErrorType {
  if (status === 401) return 'AUTH_ERROR';
  if (status === 403) return 'PERMISSION_ERROR';
  if (status === 404) return 'NOT_FOUND_ERROR';
  if (status === 429) return 'RATE_LIMIT_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'API_ERROR';
}
