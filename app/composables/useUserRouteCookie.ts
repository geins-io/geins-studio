import type { CookieRef } from '#app';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * A cookie scoped to the signed-in user and the current route path, kept for a
 * year — per-list UI preferences such as column visibility, column order and
 * pinned filters. The name is `${prefix}-${userId}${path}`.
 */
export function useUserRouteCookie<T>(
  prefix: string,
  options: { default?: () => T } = {},
): CookieRef<T> {
  const { path } = useRoute();
  const { user } = useUserStore();
  const userId = user?._id || 'default';
  return useCookie<T>(`${prefix}-${userId}${path}`, {
    default: options.default,
    maxAge: ONE_YEAR,
  });
}
