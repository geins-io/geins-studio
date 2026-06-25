/**
 * Composable for customer API operations, supporting both reactive and imperative usage
 */
import * as z from 'zod';
import type { CustomerVatValidation } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Single source of truth for the address validation shape, shared between the
 * company edit page form and the address edit panel. email/firstName/lastName
 * are optional — keep this in sync with the (optional) labels in the template.
 */
const buildAddressSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().min(1, { message: t('form.field_required') }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    addressLine1: z.string().min(1, { message: t('form.field_required') }),
    addressLine2: z.string().optional(),
    zip: z.string().min(1, { message: t('form.field_required') }),
    city: z.string().min(1, { message: t('form.field_required') }),
    region: z.string().optional(),
    country: z.string().min(1, { message: t('form.field_required') }),
  });

interface UseCustomerCompaniesReturnType {
  deleteCompany: (id?: string, entityName?: string) => Promise<boolean>;
  extractCompanyGroupsFromTags: (tags: string[]) => string[];
  convertCompanyGroupsToTags: (companyGroups: string[]) => string[];
  hasValidatedVat: Readonly<Ref<boolean>>;
  vatValid: Readonly<Ref<boolean>>;
  vatValidating: Readonly<Ref<boolean>>;
  vatNumberValidated: Readonly<Ref<string>>;
  vatValidation: Readonly<Ref<CustomerVatValidation | undefined>>;
  vatValidationSummary: Ref<DataItem[]>;
  validateVatNumber: (vatNumber: string) => Promise<void>;
  getAddresses: (
    billing: AddressUpdate,
    shipping?: AddressUpdate,
  ) => AddressUpdate[];
  addressSchema: ReturnType<typeof buildAddressSchema>;
}

/**
 * Composable for customer API operations, supporting both reactive and imperative usage.
 *
 * Provides comprehensive utilities for customer operations including company management,
 * VAT validation, address handling, and tag/group conversions.
 *
 * @returns {UseCustomerCompaniesReturnType} - An object containing customer utilities and state
 * @property {function} deleteCompany - Deletes a customer company with confirmation
 * @property {function} extractCompanyGroupsFromTags - Extracts company groups from tag array
 * @property {function} convertCompanyGroupsToTags - Converts company groups to tag format
 * @property {Readonly<Ref<boolean>>} hasValidatedVat - Whether VAT validation has been performed
 * @property {Readonly<Ref<boolean>>} vatValid - Whether the VAT number is valid
 * @property {Readonly<Ref<boolean>>} vatValidating - Whether VAT validation is in progress
 * @property {Readonly<Ref<string>>} vatNumberValidated - The last validated VAT number
 * @property {Readonly<Ref>} vatValidation - VAT validation result data
 * @property {Ref<DataItem[]>} vatValidationSummary - Summary of VAT validation data
 * @property {function} validateVatNumber - Validates a VAT number against VEIS
 * @property {function} getAddresses - Formats billing and shipping addresses for API
 */
export const useCustomerCompanies = (): UseCustomerCompaniesReturnType => {
  const { toast } = useToast();
  const { t } = useI18n();
  const { geinsLogError, geinsLogInfo } = useGeinsLog(
    'composables/useCustomerCompanies.ts',
  );

  const { customerApi } = useGeinsRepository();

  // =====================================================================================
  // COMPANY MANAGEMENT
  // =====================================================================================
  const deleteCompany = async (
    id?: string,
    entityName?: string,
  ): Promise<boolean> => {
    try {
      if (!id) {
        throw new Error('ID is required for deletion');
      }
      await customerApi.company.delete(id);
      toast({
        title: t('entity_deleted', { entityName }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
      geinsLogError('deleteCompany :::', getErrorMessage(error));
      return false;
    }
  };

  // =====================================================================================
  // COMPANY GROUPS & TAGS
  // =====================================================================================
  const extractCompanyGroupsFromTags = (tags: string[]): string[] => {
    if (!tags?.length) {
      return [];
    }
    const companyGroups: string[] = [];
    tags.forEach((tag) => {
      if (tag?.includes('group:')) {
        companyGroups.push(tag.replace('group:', ''));
      }
    });
    return companyGroups;
  };

  const convertCompanyGroupsToTags = (companyGroups: string[]): string[] => {
    if (!companyGroups?.length) {
      return [];
    }
    const tags: string[] = [];
    companyGroups.forEach((group) => {
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
  const vatValidation = ref<CustomerVatValidation>();
  const vatValidationSummary = ref<DataItem[]>([]);

  const validateVatNumber = async (vatNumber: string) => {
    if (vatNumber === vatNumberValidated.value) {
      return;
    }
    vatValidating.value = true;
    try {
      vatValidation.value = await customerApi.validateVatNumber(vatNumber);
      if (vatValidation.value) {
        vatValidationSummary.value = Object.keys(vatValidation.value)
          .filter((key) => {
            return key === 'name' || key === 'address';
          })
          .map((key) => ({
            label: key === 'address' ? t(`${key}.title`) : t(key),
            value:
              vatValidation.value?.[key as keyof CustomerVatValidation] ?? '',
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
    // Company management
    deleteCompany,
    // Tags & Groups
    extractCompanyGroupsFromTags,
    convertCompanyGroupsToTags,
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
    addressSchema: buildAddressSchema(t),
  };
};
