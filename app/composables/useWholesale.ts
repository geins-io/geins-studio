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
    tags.forEach((tag) => {
      if (tag?.includes('group:')) {
        accountGroups.push(tag.replace('group:', ''));
      }
    });
    return accountGroups;
  };

  const convertAccountGroupsToTags = (accountGroups: string[]): string[] => {
    if (!accountGroups?.length) {
      return [];
    }
    const tags: string[] = [];
    accountGroups.forEach((group) => {
      if (group) {
        tags.push(`group:${group}`);
      }
    });
    return tags;
  };

  return {
    wholesaleApi,
    deleteAccount,
    extractAccountGroupsfromTags,
    convertAccountGroupsToTags,
  };
};
