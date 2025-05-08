/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage
 */
import { useToast } from '@/components/ui/toast/use-toast';

export const useWholesale = () => {
  const nuxtApp = useNuxtApp();
  const geinsApi = nuxtApp.$geinsApi;
  const { toast } = useToast();
  const { t } = useI18n();
  const { geinsLogError } = useGeinsLog('composables/useWholesale.ts');

  const wholesaleApi = repo.wholesale(geinsApi);

  const deleteAccount = async (
    id?: string,
    entityName?: string,
  ): Promise<boolean> => {
    try {
      if (!id) {
        throw new Error('ID is required for deletion');
      }
      await wholesaleApi.account.delete(id);
      toast({
        title: t('entity_deleted', { entityName }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
      geinsLogError('deleteAccount :::', getErrorMessage(error));
      toast({
        title: t('entity_delete_failed', { entityName }),
        variant: 'negative',
      });
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
