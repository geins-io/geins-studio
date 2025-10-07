interface UseEntityUrlReturnType {
  newEntityUrlAlias: ComputedRef<string>;
  listEntityUrlAlias: ComputedRef<string>;
  getEntityName: () => string;
  getEntityBasePath: () => string;
  getEntityNewUrl: () => string;
  getEntityUrl: (id: string) => string;
  getEntityListUrl: () => string;
  getEntityNewUrlFor: (entityName: string, targetParent: string) => string;
  getEntityListUrlFor: (entityName: string, targetParent: string) => string;
}

/**
 * Composable for managing entity-related URLs and extracting entity information from routes.
 *
 * Provides utility functions for constructing entity URLs (new, edit, list) and extracting
 * entity names from the current route path. Automatically handles localization for URL aliases
 * and supports standard entity URL patterns used throughout the application.
 *
 * Can be used in two modes:
 * 1. Context-aware: Uses current route to determine entity and generate URLs
 * 2. Entity-specific: Generate URLs for any entity by providing the entity name
 *
 * @returns {UseEntityUrlReturnType} - An object containing URL utilities and entity information.
 * @property {ComputedRef<string>} newEntityUrlAlias - Localized alias for new entity URLs
 * @property {ComputedRef<string>} listEntityUrlAlias - Localized alias for list entity URLs
 * @property {function} getEntityName - Extract entity name from current route path
 * @property {function} getEntityBasePath - Get base path for the current entity
 * @property {function} getEntityNewUrl - Generate URL for creating a new entity (current context)
 * @property {function} getEntityUrl - Generate URL for editing a specific entity (current context)
 * @property {function} getEntityListUrl - Generate URL for entity list page (current context)
 * @property {function} getEntityNewUrlFor - Generate new entity URL for any entity by name
 * @property {function} getEntityUrlFor - Generate entity URL for any entity by name and ID
 * @property {function} getEntityListUrlFor - Generate list URL for any entity by name
 *
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
  const listEntityUrlAlias = computed(() => t('list_entity_url_alias'));

  const getEntityName = () => {
    return pathParts.value.at(-2) || '';
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

  const getEntityListUrl = () => {
    const basePath = getEntityBasePath();
    return `${basePath}/${listEntityUrlAlias.value}`;
  };

  const getEntityNewUrlFor = (
    targetEntityName: string,
    targetParent: string,
  ) => {
    return `/${targetParent}/${targetEntityName}/${newEntityUrlAlias.value}`;
  };

  const getEntityListUrlFor = (
    targetEntityName: string,
    targetParent: string,
  ) => {
    return `/${targetParent}/${targetEntityName}/${listEntityUrlAlias.value}`;
  };

  return {
    newEntityUrlAlias,
    listEntityUrlAlias,
    getEntityName,
    getEntityBasePath,
    getEntityNewUrl,
    getEntityUrl,
    getEntityListUrl,
    getEntityNewUrlFor,
    getEntityListUrlFor,
  };
};
