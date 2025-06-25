/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage
 */
import { useToast } from '@/components/ui/toast/use-toast';
import type { WholesaleVatValidation } from '#shared/types';

export const useWholesale = () => {
  const nuxtApp = useNuxtApp();
  const geinsApi = nuxtApp.$geinsApi;
  const { toast } = useToast();
  const { t } = useI18n();
  const { geinsLogError } = useGeinsLog('composables/useWholesale.ts');

  const wholesaleApi = repo.wholesale(geinsApi);

  // =====================================================================================
  // ACCOUNT MANAGEMENT
  // =====================================================================================
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

  // =====================================================================================
  // ACCOUNT GROUPS & TAGS
  // =====================================================================================
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

  // =====================================================================================
  // VAT VALIDATION
  // =====================================================================================
  const hasValidatedVat = ref(false);
  const vatValid = ref(false);
  const vatValidating = ref(false);
  const vatNumberValidated = ref('');
  const vatValidation = ref<WholesaleVatValidation>();
  const vatValidationSummary = ref<DataItem[]>([]);

  const validateVatNumber = async (vatNumber: string) => {
    if (vatNumber === vatNumberValidated.value) {
      return;
    }
    vatValidating.value = true;
    try {
      vatValidation.value = await wholesaleApi.validateVatNumber(vatNumber);
      if (vatValidation.value) {
        vatValidationSummary.value = Object.keys(vatValidation.value)
          .filter((key) => {
            return key === 'name' || key === 'address';
          })
          .map((key) => ({
            label: t('wholesale.' + key),
            value:
              vatValidation.value?.[key as keyof WholesaleVatValidation] ?? '',
          }));
      }
      vatValid.value = vatValidation.value.valid;
    } catch (error) {
      geinsLogError('error validating VAT number:', error);
    } finally {
      hasValidatedVat.value = true;
      vatValidating.value = false;
      vatNumberValidated.value = vatNumber;
    }
  };

  // =====================================================================================
  // ADDRESS MANAGEMENT
  // =====================================================================================
  const getAddresses = (
    billing: AddressUpdate,
    shipping?: AddressUpdate,
  ): AddressUpdate[] => {
    const addresses: AddressUpdate[] = [];
    const billingType = shipping ? 'billing' : 'billingandshipping';

    addresses.push({
      ...billing,
      addressType: billingType,
    });

    if (shipping) {
      addresses.push({
        ...shipping,
        addressType: 'shipping',
      });
    }
    return addresses;
  };

  return {
    // API
    wholesaleApi,
    // Account management
    deleteAccount,
    // Tags & Groups
    extractAccountGroupsfromTags,
    convertAccountGroupsToTags,
    // VAT validation
    hasValidatedVat: readonly(hasValidatedVat),
    vatValid: readonly(vatValid),
    vatValidating: readonly(vatValidating),
    vatNumberValidated: readonly(vatNumberValidated),
    vatValidation: readonly(vatValidation),
    vatValidationSummary,
    validateVatNumber,
    // Address helpers
    getAddresses,
  };
};
