/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage
 */

export function useWholesale() {
  const nuxtApp = useNuxtApp();
  const geinsApi = nuxtApp.$geinsApi;

  const { geinsLogError } = useGeinsLog('useWholesale');

  const wholesaleApi = repo.wholesale(geinsApi);

  const deleteAccount = async (id?: string): Promise<boolean> => {
    console.log('🚀 ~ deleteAccount ~ id:', id);
    if (!id) {
      return false;
    }
    try {
      await wholesaleApi.account.delete(id);
      return true;
    } catch (error) {
      geinsLogError(error);
      return false;
    }
  };

  return {
    wholesaleApi,
    deleteAccount,
  };
}
