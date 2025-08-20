/**
 * Gets the base URL for the application based on the current environment.
 *
 * In development mode, returns the BASE_URL environment variable or defaults to localhost.
 * In production on Vercel, returns the appropriate Vercel URL based on the deployment environment.
 * Otherwise, returns the fallback URL, BASE_URL environment variable, or localhost as a last resort.
 *
 * @param fallbackBaseUrl - Optional fallback URL to use when the function is called at runtime
 *                         and environment variables are not available or suitable
 * @returns The base URL string for the current environment
 */
export function getBaseUrl(fallbackBaseUrl?: string) {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.BASE_URL ?? 'http://localhost:3000';
  }

  if (process.env.VERCEL) {
    const isVercelProduction = process.env.VERCEL_ENV === 'production';
    return isVercelProduction
      ? (process.env.BASE_URL ??
          `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
      : `https://${process.env.VERCEL_BRANCH_URL}`;
  }

  return fallbackBaseUrl || process.env.BASE_URL || 'http://localhost:3000';
}

/**
 * Gets the authentication base URL by combining the base URL with the auth path.
 *
 * Uses the AUTH_PATH environment variable if available, otherwise defaults to '/api/auth'.
 *
 * @returns The complete authentication URL string
 */
export function getAuthBaseUrl() {
  const baseURl = getBaseUrl();
  if (process.env.AUTH_PATH) {
    return `${baseURl}${process.env.AUTH_PATH}`;
  }
  return `${baseURl}/api/auth`;
}
