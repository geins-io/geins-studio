/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage
 */
import { useToast } from '@/components/ui/toast/use-toast';
import type { WholesaleVatValidation } from '#shared/types';

interface UseWholesaleReturnType {
  wholesaleApi: ReturnType<typeof useGeinsRepository>['wholesaleApi'];
  deleteAccount: (id?: string, entityName?: string) => Promise<boolean>;
  extractAccountGroupsfromTags: (tags: string[]) => string[];
  convertAccountGroupsToTags: (accountGroups: string[]) => string[];
  hasValidatedVat: Readonly<Ref<boolean>>;
  vatValid: Readonly<Ref<boolean>>;
  vatValidating: Readonly<Ref<boolean>>;
  vatNumberValidated: Readonly<Ref<string>>;
  vatValidation: Readonly<Ref<WholesaleVatValidation | undefined>>;
  vatValidationSummary: Ref<DataItem[]>;
  validateVatNumber: (vatNumber: string) => Promise<void>;
  getAddresses: (
    billing: AddressUpdate,
    shipping?: AddressUpdate,
  ) => AddressUpdate[];
}

/**
 * Composable for wholesale API operations, supporting both reactive and imperative usage.
 *
 * Provides comprehensive utilities for wholesale operations including account management,
 * VAT validation, address handling, and tag/group conversions.
 *
 * @returns {UseWholesaleReturnType} - An object containing wholesale utilities and state
 * @property {object} wholesaleApi - Wholesale API repository instance
 * @property {function} deleteAccount - Deletes a wholesale account with confirmation
 * @property {function} extractAccountGroupsfromTags - Extracts account groups from tag array
 * @property {function} convertAccountGroupsToTags - Converts account groups to tag format
 * @property {Readonly<Ref<boolean>>} hasValidatedVat - Whether VAT validation has been performed
 * @property {Readonly<Ref<boolean>>} vatValid - Whether the VAT number is valid
 * @property {Readonly<Ref<boolean>>} vatValidating - Whether VAT validation is in progress
 * @property {Readonly<Ref<string>>} vatNumberValidated - The last validated VAT number
 * @property {Readonly<Ref>} vatValidation - VAT validation result data
 * @property {Ref<DataItem[]>} vatValidationSummary - Summary of VAT validation data
 * @property {function} validateVatNumber - Validates a VAT number against VEIS
 * @property {function} getAddresses - Formats billing and shipping addresses for API
 */
export const useWholesale = (): UseWholesaleReturnType => {
  const { toast } = useToast();
  const { t } = useI18n();
  const { geinsLogError, geinsLogInfo } = useGeinsLog(
    'composables/useWholesale.ts',
  );

  const { wholesaleApi } = useGeinsRepository();

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
            label: key === 'address' ? t(`${key}.title`) : t(key),
            value:
              vatValidation.value?.[key as keyof WholesaleVatValidation] ?? '',
          }));
      }
      vatValid.value = vatValidation.value.valid;
    } catch (error) {
      geinsLogInfo(
        'VAT number could not be validated using VEIS :::',
        getErrorMessage(error),
      );
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
