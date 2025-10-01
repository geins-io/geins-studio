export const useEntityUrl = (fullPath: string) => {
  const { t } = useI18n();

  const newEntityUrlAlias = t('new_entity_url_alias');
  const listEntitytUrlAlias = t('list_entity_url_alias');

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

  const getEntityUrl = (dataProp: string) => {
    const parts = fullPath.split('/');
    parts.pop();
    const path = parts.join('/');

    return `${path}/${dataProp}`;
  };

  const getEntityListUrl = () => {
    const parts = fullPath.split('/');
    if (parts[parts.length - 1] === listEntitytUrlAlias) {
      return '';
    }
    parts.pop();
    const path = parts.join('/');
    return `${path}/${listEntitytUrlAlias}`;
  };

  return {
    newEntityUrlAlias,
    getEntityName,
    getNewEntityUrl,
    getEntityUrl,
    getEntityListUrl,
  };
};
