# `useCustomerAccounts`

The `useCustomerAccounts` composable provides comprehensive utilities for customer account operations including account management, VAT validation, address handling, and more.

:::warning NOTE
This composable is designed specifically for customer-related functionalities and may not be suitable for general use cases.
:::

## Features

- **Account management** with deletion operations and error handling
- **VAT validation** using VEIS (VAT Information Exchange System)
- **Address formatting** for billing and shipping

## Usage

### Basic Usage

```ts
const {
  validateVatNumber,
  hasValidatedVat,
  vatValid,
  vatValidating,
  vatValidation,
  vatValidationSummary,
} = useCustomerAccounts();

// VAT number input
const vatNumber = ref('');

watch(vatNumber, async (newVat) => {
  if (newVat && newVat.length > 5) {
    await validateVatNumber(newVat);
  }
});
```

```vue
<template>
  <label for="vat-number">VAT Number:</label>
  <input
    id="vat-number"
    v-model="vatNumber"
    type="text"
    placeholder="e.g., DE123456789"
  />

  <span v-if="vatValidating">Validating...</span>
  <span v-else-if="hasValidatedVat && vatValid">Valid VAT</span>
  <span v-else-if="hasValidatedVat && !vatValid">Invalid VAT</span>
  <span v-else>Enter a VAT Number</span>
</template>
```

## Properties and Methods

### Account Management

#### `deleteAccount`

```ts
deleteAccount(id?: string, entityName?: string): Promise<boolean>
```

Deletes a customer account with error handling and user feedback.

- **Parameters**:
  - `id`: Account ID to delete
  - `entityName`: Display name for toast messages

- **Returns**: Promise resolving to `true` on success, `false` on failure
- **Features**: Toast notifications, error logging, validation

### Tag and Group Utilities

#### `extractAccountGroupsfromTags`

```ts
extractAccountGroupsfromTags(tags: string[]): string[]
```

Extracts account group names from a tags array.

- **Parameters**: Array of tags (e.g., `['group:premium', 'status:active']`)
- **Returns**: Array of group names (e.g., `['premium']`)
- **Logic**: Filters tags starting with `'group:'` and removes the prefix

#### `convertAccountGroupsToTags`

```ts
convertAccountGroupsToTags(accountGroups: string[]): string[]
```

Converts account group names to tag format.

- **Parameters**: Array of group names (e.g., `['premium', 'europe']`)
- **Returns**: Array of formatted tags (e.g., `['group:premium', 'group:europe']`)

### VAT Validation State

#### `hasValidatedVat`

```ts
hasValidatedVat: Readonly<Ref<boolean>>;
```

Whether VAT validation has been performed.

#### `vatValid`

```ts
vatValid: Readonly<Ref<boolean>>;
```

Whether the validated VAT number is valid.

#### `vatValidating`

```ts
vatValidating: Readonly<Ref<boolean>>;
```

Whether VAT validation is currently in progress.

#### `vatNumberValidated`

```ts
vatNumberValidated: Readonly<Ref<string>>;
```

The VAT number that was last validated.

#### `vatValidation`

```ts
vatValidation: Readonly<Ref<CustomerVatValidation | undefined>>;
```

Complete VAT validation result from VEIS.

#### `vatValidationSummary`

```ts
vatValidationSummary: Ref<DataItem[]>;
```

Formatted summary of VAT validation data for display.

### VAT Validation Methods

#### `validateVatNumber`

```ts
validateVatNumber(vatNumber: string): Promise<void>
```

Validates a VAT number using the VEIS system.

- **Parameters**: VAT number to validate
- **Features**: Caching, error handling, summary generation
- **Side effects**: Updates all VAT-related reactive state

### Address Utilities

#### `getAddresses`

```ts
getAddresses(billing: AddressUpdate, shipping?: AddressUpdate): AddressUpdate[]
```

Formats billing and shipping addresses for API submission.

- **Parameters**:
  - `billing`: Billing address data
  - `shipping`: Optional shipping address data

- **Returns**: Array of properly formatted addresses
- **Logic**: Sets appropriate `addressType` values based on parameters

## Type Definitions

```ts
function useCustomerAccounts(): UseCustomerAccountsReturnType;

interface UseCustomerAccountsReturnType {
  deleteAccount: (id?: string, entityName?: string) => Promise<boolean>;
  extractAccountGroupsfromTags: (tags: string[]) => string[];
  convertAccountGroupsToTags: (accountGroups: string[]) => string[];
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
}

interface CustomerVatValidation {
  valid: boolean;
  vatNumber: string;
  name?: string;
  address?: string;
  requestDate?: string;
}

interface AddressUpdate {
  firstName: string;
  lastName: string;
  companyName?: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  addressType?: 'billing' | 'shipping' | 'billingandshipping';
}
```

## Dependencies

This composable depends on:

1. **useI18n** for internationalization
