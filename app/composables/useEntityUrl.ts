/** Return type for {@link useEntityUrl}. */
interface UseEntityUrlReturnType {
  newEntityUrlAlias: ComputedRef<string>;
  getEntityName: () => string;
  getEntityBasePath: () => string;
  getEntityNewUrl: () => string;
  getEntityUrl: (id: string) => string;
}

/**
 * Composable for **current-route** entity URLs — it derives everything from the
 * active route path. Use it on entity `[id].vue` / `new` pages, where the route
 * always has a trailing action segment (`new` / `:id`) so the base path is the
 * folder above it.
 *
 * For links to *another* entity (by key), or from a list/index page (which has
 * no trailing segment), build URLs from the registry instead:
 * `entityBasePath(key)` / `entityListHref(key)` / `entityDetailHref(key, id)`
 * (`#shared/utils/entities`).
 *
 * @returns {UseEntityUrlReturnType} - Current-route URL utilities.
 * @property {ComputedRef<string>} newEntityUrlAlias - Localized alias for the "new" URL segment
 * @property {function} getEntityName - Extract entity name from current route path (URL folder)
 * @property {function} getEntityBasePath - Base path for the current entity (drops the last segment)
 * @property {function} getEntityNewUrl - URL for creating a new entity (current context)
 * @property {function} getEntityUrl - URL for a specific entity id (current context)
 */
export const useEntityUrl = (): UseEntityUrlReturnType => {
  const route = useRoute();
  const { t } = useI18n();

  const fullPath = ref(route.path);

  const pathParts = computed(() => {
    if (!fullPath.value) return [];
    return fullPath.value.split('/').filter(Boolean);
  });

  const newEntityUrlAlias = computed(() => t('new_entity_url_alias'));

  const getEntityName = () => {
    return pathParts.value.at(-2)?.replace(/-/g, '_') || '';
  };

  const getEntityBasePath = () => {
    const parts = [...pathParts.value];
    if (parts.length < 2) return '/';
    parts.pop();
    return '/' + parts.join('/');
  };

  const getEntityNewUrl = () => {
    const basePath = getEntityBasePath();
    return `${basePath}/${newEntityUrlAlias.value}`;
  };

  const getEntityUrl = (id: string) => {
    const basePath = getEntityBasePath();
    return `${basePath}/${id}`;
  };

  return {
    newEntityUrlAlias,
    getEntityName,
    getEntityBasePath,
    getEntityNewUrl,
    getEntityUrl,
  };
};
