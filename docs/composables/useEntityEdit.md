# `useEntityEdit`

The `useEntityEdit` composable provides a comprehensive framework for entity editing and creation workflows. It handles form management, validation, CRUD operations, unsaved changes tracking, and UI state management for the entity edit/create page.

## Features

- **Create and update modes** with automatic routing
- **Form validation** with VeeValidate integration
- **Unsaved changes tracking** with navigation guards
- **Step-based validation** for multi-step forms
- **Repository abstraction** for flexible API integration
- **UI state management** for tabs and sidebars

## Usage

### Basic Usage

```ts
const { productApi } = useGeinsRepository();

const entityBase: Product = {
  name: '',
  price: 99.99,
  description: '',
};

const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      name: z.string().min(1, { message: t('form.field_required') }),
      price: z.number().min(0, { message: t('form.invalid_price') }),
      description: z.string().optional(),
    }),
  }),
);

const {
  entityData,
  createMode,
  loading,
  form,
  formValid,
  formTouched,
  validateOnChange,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  currentTab,
  showSidebar,
  entityPageTitle,
  entityListUrl,
  newEntityUrl,
  entityId,
  entityLiveStatus,
  parseAndSaveData,
  validateSteps,
  createEntity,
  updateEntity,
  deleteEntity,
  setOriginalSavedData,
  confirmLeave,
} = useEntityEdit<
  ProductBase,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductApiOptions
>({
  repository: productApi.product,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  reshapeEntityData: (entity) => mapApiToForm(entity),
});
```

## Options

### `entityName`

A string representing the name of the entity being edited (e.g., "product"). This is used for generating titles and URLs. If not provided, defaults to using `getEntityName()` from [`useEntityUrl`](/composables/useEntityUrl).

### `repository`

An object containing the CRUD methods for the entity. It is recommended to use an instance from [`useGeinsRepository`](/composables/useGeinsRepository). It should have the following structure:

```ts
{
  get: (id: string, options?: TOptions) => Promise<TResponse>;
  create: (data: TCreate, options?: TOptions) => Promise<TResponse>;
  update: (id: string, data: TUpdate, options?: TOptions) => Promise<TResponse>;
  delete?: (id: string) => Promise<void>;
}
```

### `validationSchema`

A VeeValidate schema created using `toTypedSchema` from `@vee-validate/zod`. This schema defines the validation rules for the form.

### `initialEntityData`

An object representing the initial data for creating a new entity. This should match the `TCreate` type.

### `initialUpdateData`

An object representing the initial data structure for updating an existing entity. This should match the `TUpdate` type.

### `excludeSaveFields`

An array of field names (keys of `TBase`) to exclude from unsaved changes tracking. These fields will not be considered when determining if there are unsaved changes.

### `stepValidationMap`

An object mapping step indices to form field names. This is used for validating specific steps in multi-step forms. For example, `{ 0: 'details', 1: 'settings' }` means step 0 validates the `details` field and step 1 validates the `settings` field.

### `debounceMs`

The debounce delay in milliseconds for `onFormValuesChange` calls. Defaults to 500ms.

### `reshapeEntityData`

Transforms the API response data into the format expected by the form.

- **Signature**: `(entity: TResponse) => TUpdate`
- **When called**: By `parseAndSaveData` whenever entity data is loaded from the API
- **Purpose**: Essential for adapting backend data models to frontend form requirements

### `parseEntityData`

Processes the entity data after it is fetched and reshaped from the API.

- **Signature**: `(entity: TResponse) => Promise<void> | void`
- **When called**: By `parseAndSaveData` after `reshapeEntityData` completes
- **Purpose**: Performs additional custom processing, side effects, or updates to related data

### `getInitialFormValues`

Generates the initial form values based on the entity data.

- **Signature**: `(entityData: TCreate | TUpdate, createMode?: boolean) => object`
- **When called**: During form initialization in both create and edit modes
- **Purpose**: Allows custom mapping from entity data structure to form field structure

### `onFormValuesChange`

Called whenever the form values change (debounced).

- **Signature**: `(values: GenericObject, entityDataCreate: Ref<TCreate>, entityDataUpdate: Ref<TUpdate> | ComputedRef<TUpdate>, createMode: Ref<boolean> | ComputedRef<boolean>) => Promise<void> | void`
- **When called**: On every form value change (debounced by `debounceMs`)
- **Purpose**: Syncs form changes back to entity data in real-time, useful for computed fields or live validation

#### `prepareCreateData`

Transforms the form data into the format expected by the create API endpoint.

- **Signature**: `(formData: GenericObject) => TCreate`
- **When called**: In `createEntity` before making the API call
- **Purpose**: Handles data formatting, field mapping, or adding metadata before creation

#### `prepareUpdateData`

Transforms the form data into the format expected by the update API endpoint.

- **Signature**: `(formData: GenericObject, entity?: TUpdate) => TUpdate`
- **When called**: In `updateEntity` before making the API call
- **Purpose**: Handles data formatting, field mapping, or merging with existing entity data

## Lifecycle & Data Flow

### Create Flow

1. **Initialization**: `createMode` is set to `true`, `entityData` initialized with `initialEntityData`
2. **Form Setup**: If `getInitialFormValues` is provided, it's called to set up initial form values
3. **User Interaction**: User fills out the form (validated using `validationSchema`)
4. **Real-time Updates**: As user types, `onFormValuesChange` is triggered (debounced)
5. **Submission**: On form submission, `createEntity` is called:
   - Optional `additionalValidation` is executed
   - `prepareCreateData` transforms form data (if provided)
   - Repository's `create` method is called
   - User is redirected to edit page for the newly created entity

### Update Flow

1. **Data Fetching**: `createMode` is set to `false`, entity data fetched from API
2. **Data Processing**: When entity data is received:
   - `reshapeEntityData` transforms API response to form-compatible format
   - `parseAndSaveData` processes the data
   - `parseEntityData` performs additional processing (if provided)
   - `setOriginalSavedData` saves snapshot for unsaved changes tracking
3. **Form Setup**: If `getInitialFormValues` is provided, it's called with fetched data
4. **User Interaction**: User modifies form fields (validated using `validationSchema`)
5. **Real-time Updates**: As user types, `onFormValuesChange` is triggered (debounced)
6. **Submission**: On form submission, `updateEntity` is called:
   - Optional `additionalValidation` is executed
   - `prepareUpdateData` transforms form data (if provided)
   - Repository's `update` method is called
   - `parseAndSaveData` processes the response
   - Form state updated with latest data, unsaved changes cleared

### Central Data Management

#### `parseAndSaveData`

The central data processor called in multiple scenarios:

- After API fetch (loading existing entity data)
- After successful update operations
- Manual refresh operations

**Process sequence:**

1. Calls `reshapeEntityData` to transform API response
2. Optionally calls `setOriginalSavedData` to update unsaved changes baseline
3. Calls `parseEntityData` (if provided) for additional processing

#### `setOriginalSavedData`

Creates a JSON snapshot of current entity data for unsaved changes detection. Called automatically by `parseAndSaveData` (when `setSavedData` is true) and can be called manually to establish new baselines.

## Properties and Methods

### Entity State

#### `entityName`

A `ref` representing the name of the entity being edited (e.g., "product").

#### `entityId`

A `computed` reference representing the current entity ID extracted from the route parameters. It will be an empty string in create mode.

#### `entityData`

A `computed` reference representing the combined entity data. It will be of type `TCreate` in create mode and `TUpdate` in edit mode.

#### `entityDataCreate`

A `ref` representing the entity data in create mode. It is of type `TCreate`.

#### `entityDataUpdate`

A `ref` representing the entity data in update mode. It is of type `TUpdate`.

#### `createMode`

A `ref` indicating whether the current mode is create (true) or edit (false).

#### `loading`

A `ref` indicating whether an async operation (fetching, creating, updating, deleting) is in progress.

### UI State

#### `currentTab`

A `ref` representing the current active tab index in the entity edit page.

#### `showSidebar`

A `computed` reference indicating whether the sidebar should be displayed based on screen size and current tab

#### `entityPageTitle`

A `computed` reference representing the page title, which changes based on create or edit mode.

#### `entityListUrl`

A `string` representing the URL for the entity list page.

#### `newEntityUrl`

A `string` representing the URL for creating a new entity.

### Form State

#### `form`

The VeeValidate form instance created using the provided validation schema and initial values.

#### `formValidation`

A `ref` containing the current validation state of the form.

#### `validateOnChange`

A `ref` indicating whether form validation should occur on every change. It is initially set to
`false` and can be enabled after the first submission attempt.

#### `formValid`

A `computed` reference indicating whether the form is currently valid.

#### `formTouched`

A `computed` reference indicating whether the form has been touched/modified.

### Unsaved Changes

#### `hasUnsavedChanges`

A `computed` reference indicating whether there are unsaved changes in the form compared to the last
saved state.

#### `unsavedChangesDialogOpen`

A `ref` indicating whether the unsaved changes confirmation dialog is currently open.

### CRUD Operations

#### `createEntity`

```ts
createEntity(
  additionalValidation?: () => Promise<boolean>,
  queryOptions?: TOptions
): Promise<TResponse | undefined>
```

Creates a new entity with validation and error handling.

- **Parameters:**
  - `additionalValidation` (optional): A function that performs extra validation and returns a Promise resolving to `true` if valid.
  - `queryOptions` (optional): Additional options to pass to the repository's create method.
- **Returns:** A Promise that resolves to the created entity of type `TResponse` or `undefined` if creation failed.

#### `updateEntity`

```ts
updateEntity(
  additionalValidation?: () => Promise<boolean>,
  queryOptions?: TOptions,
  setSavedData?: boolean
): Promise<TResponse | undefined>
```

Updates an existing entity with validation and error handling.

- **Parameters:**
  - `additionalValidation` (optional): A function that performs extra validation and returns a Promise resolving to `true` if valid.
  - `queryOptions` (optional): Additional options to pass to the repository's update method.
  - `setSavedData` (optional): Whether to update the original saved data reference after a successful update. Defaults to `true`.
- **Returns:** A Promise that resolves to the updated entity of type `TResponse` or `undefined` if the update failed.

#### `deleteEntity`

```ts
deleteEntity(): Promise<boolean>
```

Deletes the current entity with confirmation.

- **Returns:** A Promise that resolves to `true` if deletion was successful, or `false` if it failed or was cancelled.

### Data Management

#### `parseAndSaveData`

```ts
parseAndSaveData(
  entity: TResponse,
  setSavedData: boolean = true
): Promise<void>
```

Processes and saves entity data from API response.

- **Parameters:**
  - `entity`: The entity data returned from the API of type `TResponse`.
  - `setSavedData` (optional): Whether to update the original saved data reference after parsing. Defaults to `true`.
- **Returns:** A Promise that resolves when parsing and saving is complete.

#### `setOriginalSavedData`

```ts
setOriginalSavedData(): void
```

Updates the original data reference for unsaved changes tracking.

- **Returns:** Nothing. It updates internal state.

### Validation

#### `validateSteps`

```ts
validateSteps(
  steps: number[],
  stepValidationMap?: Record<number, string>
): Promise<boolean>
```

Validates specific form steps based on validation mapping.

- **Parameters:**
  - `steps`: An array of step indices to validate.
  - `stepValidationMap` (optional): A mapping of step indices to form field names for targeted validation.
- **Returns:** A Promise that resolves to `true` if all specified steps are valid, or `false` if any step is invalid.

## Integrated Composables

### `useUnsavedChanges`

```ts
const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
  useUnsavedChanges(
    entityDataUpdate,
    originalEntityData,
    createMode,
    excludeFields,
  );
```

### `useEntityUrl`

```ts
const { getEntityName, getEntityNewUrl, getEntityListUrl } = useEntityUrl();
```

### `useLayout`

```ts
const { hasReducedSpace } = useLayout();

const showSidebar = computed(() => {
  return !hasReducedSpace.value && currentTab.value === 0;
});
```

## Type Definitions

```ts
function useEntityEdit<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(
  options: EntityEditOptions<TBase, TResponse, TCreate, TUpdate, TOptions>,
): UseEntityEditReturnType<TBase, TResponse, TCreate, TUpdate>;

interface EntityEditOptions<TBase, TResponse, TCreate, TUpdate, TOptions> {
  entityName?: string;
  repository: {
    get: (id: string, options?: TOptions) => Promise<TResponse>;
    create: (data: TCreate, options?: TOptions) => Promise<TResponse>;
    update: (
      id: string,
      data: TUpdate,
      options?: TOptions,
    ) => Promise<TResponse>;
    delete?: (id: string) => Promise<void>;
  };
  validationSchema: ReturnType<typeof toTypedSchema>;
  initialEntityData: TCreate;
  initialUpdateData: TUpdate;
  excludeSaveFields?: StringKeyOf<TBase>[];
  parseEntityData?: (entity: TResponse) => Promise<void> | void;
  prepareCreateData?: (formData: GenericObject) => TCreate;
  prepareUpdateData?: (formData: GenericObject, entity?: TUpdate) => TUpdate;
  reshapeEntityData: (entity: TResponse) => TUpdate;
  getInitialFormValues?: (
    entityData: TCreate | TUpdate,
    createMode?: boolean,
  ) => object;
  onFormValuesChange?: (
    values: GenericObject,
    entityDataCreate: Ref<TCreate>,
    entityDataUpdate: Ref<TUpdate> | ComputedRef<TUpdate>,
    createMode: Ref<boolean> | ComputedRef<boolean>,
  ) => Promise<void> | void;
  stepValidationMap?: Record<number, string>;
  debounceMs?: number;
}

interface UseEntityEditReturnType<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
> {
  // State
  entityName: string;
  entityId: ComputedRef<string>;
  createMode: Ref<boolean>;
  loading: Ref<boolean>;
  newEntityUrl: string;
  entityListUrl: string;
  currentTab: Ref<number>;
  showSidebar: ComputedRef<boolean>;

  // Entity data
  refreshEntityData: Ref<() => Promise<void>>;
  entityLiveStatus: Ref<boolean>;
  entityDataCreate: Ref<TCreate>;
  entityDataUpdate: Ref<TUpdate>;
  entityData: ComputedRef<TCreate | TUpdate>;
  entityPageTitle: ComputedRef<string>;

  // Form
  form: ReturnType<typeof useForm>;
  validateOnChange: Ref<boolean>;
  formValidation: Ref<any>;
  formValid: ComputedRef<boolean>;
  formTouched: ComputedRef<boolean>;

  // Unsaved changes
  hasUnsavedChanges: ComputedRef<boolean>;
  unsavedChangesDialogOpen: Ref<boolean>;
  setOriginalSavedData: () => void;
  confirmLeave: () => Promise<boolean>;

  // Methods
  parseAndSaveData: (
    entity: TResponse,
    setSavedData?: boolean,
  ) => Promise<void>;
  validateSteps: (
    steps: number[],
    stepValidationMap?: Record<number, string>,
  ) => Promise<boolean>;
  createEntity: (
    additionalValidation?: () => Promise<boolean>,
    queryOptions?: any,
  ) => Promise<TResponse | undefined>;
  updateEntity: (
    additionalValidation?: () => Promise<boolean>,
    queryOptions?: any,
    setSavedData?: boolean,
  ) => Promise<TResponse | undefined>;
  deleteEntity: () => Promise<boolean>;
}

export interface EntityBase {
  _id: string;
  _type: string;
}

type CreateEntity<T> = Omit<T, keyof EntityBase>;
type UpdateEntity<T> = Partial<CreateEntity<T>> & Partial<EntityBase>;
type ResponseEntity<T> = T & EntityBase;

interface ApiOptions<TFields> {
  fields?: TFields[];
  pageSize?: string;
}
```

## Dependencies

This composable depends on:

1. **VeeValidate** for form validation
2. **useI18n** for internationalization
