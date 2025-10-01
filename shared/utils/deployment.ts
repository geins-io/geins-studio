/**
 * Gets the base URL for the application based on the current environment.
 *
 * In development mode, returns the BASE_URL environment variable or defaults to localhost.
 * In production on Vercel, returns the appropriate Vercel URL based on the deployment environment.
 * Otherwise, returns the BASE_URL environment variable, or localhost as a last resort.
 *
 * @returns The base URL string for the current environment
 */
export function getBaseUrl() {
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

  return process.env.BASE_URL ?? 'http://localhost:3000';
}

/**
 * Gets the authentication base URL by combining the base URL with the auth path.
 *
 * Uses the AUTH_PATH environment variable if available, otherwise defaults to '/api/auth'.
 *
 * @returns The complete authentication URL string
 */
export function getAuthBaseUrl() {
  const baseUrl = getBaseUrl();
  if (process.env.AUTH_PATH) {
    return `${baseUrl}${process.env.AUTH_PATH}`;
  }
  return `${baseUrl}/api/auth`;
}
