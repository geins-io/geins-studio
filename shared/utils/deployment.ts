import { log } from './log';

const logger = log('deployment.ts');
/**
 * Gets the base URL for the application based on the current environment.
 *
 * If running in a Vercel preview environment, it constructs the URL using the VERCEL_BRANCH_URL.
 * Otherwise, it falls back to the BASE_URL environment variable or defaults to 'http://localhost:3000'.
 *
 * @returns The base URL string for the current environment
 */
export function getBaseUrl() {
  if (
    process.env.VERCEL &&
    process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_TARGET_ENV === 'preview'
  ) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  if (
    (process.env.VERCEL_TARGET_ENV === 'production' ||
      process.env.VERCEL_TARGET_ENV === 'qa') &&
    !process.env.BASE_URL
  ) {
    logger.geinsLogWarn(
      `BASE_URL is not set in ${process.env.VERCEL_TARGET_ENV} environment. Falling back to default localhost URL.`,
    );
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

/**
 * Whether the dev-only pages under `app/pages/dev/**` are part of the build.
 *
 * Read from `nuxt.config.ts` so the routes are dropped at build time, not
 * hidden at runtime — the harness copy is hardcoded English and must not reach
 * the bundle. `import.meta.dev` is false on every Vercel build, and the QA
 * project deploys as production against the QA API, so the opt-in flag is set
 * on the QA and preview projects and never on prod. Local `nuxt dev` gets the
 * pages without it.
 */
export function includeDevPages() {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.INCLUDE_DEV_PAGES === 'true'
  );
}
