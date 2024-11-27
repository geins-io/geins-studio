export function useEntity(fullPath: string) {
  const { t } = useI18n();

  const newEntityUrlAlias = t('new_entity_url_alias');

  const getEntityName = () => {
    const parts = fullPath.split('/');
    return parts[parts.length - 2] || '';
  };

  const getNewEntityUrl = () => {
    const parts = fullPath.split('/');
    parts.pop();
    const path = parts.join('/');

    return `${path}/${newEntityUrlAlias}`;
  };

  const getEditEntityUrl = (dataProp: string) => {
    const parts = fullPath.split('/');
    parts.pop();
    const path = parts.join('/');

    return `${path}/${dataProp}`;
  };

  return {
    newEntityUrlAlias,
    getEntityName,
    getNewEntityUrl,
    getEditEntityUrl,
  };
}
