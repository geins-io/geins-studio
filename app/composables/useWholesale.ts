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

  return {
    wholesaleApi,
    deleteAccount,
  };
};
