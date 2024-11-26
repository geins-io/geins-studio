export function useEntity() {
  const { t } = useI18n();

  const newEntityUrlAlias = t('new_entity_url_alias');

  const getEntityName = (fullPath: string) => {
    const parts = fullPath.split('/');
    return parts[parts.length - 2];
  };

  const getNewEntityUrl = (fullPath: string) => {
    const parts = fullPath.split('/');
    parts.pop();
    const path = parts.join('/');

    return `${path}/${newEntityUrlAlias}`;
  };

  return { newEntityUrlAlias, getEntityName, getNewEntityUrl };
}
