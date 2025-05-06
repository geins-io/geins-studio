/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage
 */

export const useWholesale = () => {
  const nuxtApp = useNuxtApp();
  const geinsApi = nuxtApp.$geinsApi;

  const { geinsLogError } = useGeinsLog('composables/useWholesale.ts');

  const wholesaleApi = repo.wholesale(geinsApi);

  const deleteAccount = async (id?: string): Promise<boolean> => {
    if (!id) {
      return false;
    }
    try {
      await wholesaleApi.account.delete(id);
      return true;
    } catch (error) {
      geinsLogError('deleteAccount :::', getErrorMessage(error));
      return false;
    }
  };

  const extractAccountGroupsfromTags = (tags: string[]): string[] => {
    if (!tags?.length) {
      return [];
    }
    const accountGroups: string[] = [];
    for (let i = tags.length - 1; i >= 0; i--) {
      if (tags[i]?.includes('group:')) {
        const tag = tags[i] || '';
        accountGroups.push(tag.replace('group:', ''));
        tags.splice(i, 1);
      }
    }
    return accountGroups;
  };

  const convertAccountGroupsToTags = (accountGroups: string[]): string[] => {
    if (!accountGroups?.length) {
      return [];
    }
    const tags: string[] = [];
    for (let i = accountGroups.length - 1; i >= 0; i--) {
      const group = accountGroups[i] || '';
      tags.push(`group:${group}`);
      accountGroups.splice(i, 1);
    }
    return tags;
  };

  return {
    wholesaleApi,
    deleteAccount,
    extractAccountGroupsfromTags,
    convertAccountGroupsToTags,
  };
};
