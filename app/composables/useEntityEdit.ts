import { useDebounceFn } from '@vueuse/core';
import { useForm, type GenericObject } from 'vee-validate';
import { useToast } from '@/components/ui/toast/use-toast';
import type { toTypedSchema } from '@vee-validate/zod';

interface EntityEditOptions<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
> {
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
  externalChanges?: Ref<boolean>;
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
  entityFetchKey: ComputedRef<string>;

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

/**
 * Composable for managing entity edit operations with comprehensive form handling,
 * validation, and CRUD operations. Provides a complete solution for creating and
 * editing entities with built-in state management, form validation, and user feedback.
 *
 * Features include create/update/delete operations, form validation with VeeValidate,
 * unsaved changes tracking, step-based validation, debounced form updates, and
 * automatic URL management for entity navigation.
 *
 * @template TBase - Base entity type
 * @template TResponse - Response entity type extending ResponseEntity<TBase>
 * @template TCreate - Create entity type extending CreateEntity<TBase>
 * @template TUpdate - Update entity type extending UpdateEntity<TBase>
 * @template TOptions - API options type extending ApiOptions<string>
 * @param {EntityEditOptions} options - Configuration options for entity editing
 * @returns {UseEntityEditReturnType} - Object containing entity edit state, methods, and form management
 */
export function useEntityEdit<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
  TOptions extends ApiOptions<string> = ApiOptions<string>,
>(options: EntityEditOptions<TBase, TResponse, TCreate, TUpdate, TOptions>) {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { toast } = useToast();
  const {
    newEntityUrlAlias,
    getEntityName,
    getEntityNewUrl,
    getEntityListUrl,
  } = useEntityUrl();
  const { hasReducedSpace } = useLayout();

  // Core state
  const entityName = options.entityName || getEntityName();
  const newEntityUrl = getEntityNewUrl();
  const entityListUrl = getEntityListUrl();
  const createMode = ref(route.params.id === newEntityUrlAlias.value);
  const loading = ref(false);
  const refreshEntityData = ref<() => Promise<void>>(() => Promise.resolve());
  const entityLiveStatus = ref<boolean>(false);
  const { showErrorToast } = usePageError({ entityName });

  // Entity data
  const entityDataCreate = ref<TCreate>(options.initialEntityData);
  const entityDataUpdate = ref<TUpdate>(options.initialUpdateData);
  const entityData = computed(() =>
    createMode.value ? entityDataCreate.value : entityDataUpdate.value,
  );

  const entityId = computed<string>(
    () => entityData.value?._id || String(route.params.id),
  );

  const entityFetchKey = computed(() => `${entityName}-${entityId.value}`);

  const entityPageTitle = computed(() =>
    createMode.value
      ? t('new_entity', { entityName }) +
        (entityData.value?.name ? ': ' + entityData.value.name : '')
      : entityData.value?.name || t('edit_entity', { entityName }),
  );

  // Sidebar + tabs
  const currentTab = ref(0);
  const showSidebar = computed(() => {
    return !hasReducedSpace.value && currentTab.value === 0;
  });

  // Original data tracking for unsaved changes
  const originalEntityData = ref<string>('');

  // Unsaved changes integration
  const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
    useUnsavedChanges(
      entityDataUpdate,
      originalEntityData,
      createMode,
      options.excludeSaveFields,
      options.externalChanges,
    );

  // Form management
  const validateOnChange = ref(false);
  const formValidation = ref();

  // Initialize form with proper initial values
  const form = useForm({
    validationSchema: options.validationSchema,
    initialValues: options.getInitialFormValues
      ? options.getInitialFormValues(entityData.value, createMode.value)
      : {},
  });

  // Form state computeds
  const formValid = computed(() => form?.meta.value.valid ?? true);
  const formTouched = computed(() => form?.meta.value.touched ?? false);

  // Form values watcher
  if (options.onFormValuesChange) {
    watch(
      form.values,
      useDebounceFn(async (values) => {
        if (validateOnChange.value) {
          await form.validate();
        }

        if (options.onFormValuesChange) {
          await options.onFormValuesChange(
            values,
            entityDataCreate as Ref<TCreate>,
            entityDataUpdate as Ref<TUpdate>,
            createMode,
          );
        }
      }, options.debounceMs || 500),
      { deep: true },
    );
  }

  // Parse and save data helper
  const parseAndSaveData = async (
    entity: TResponse,
    setSavedData: boolean = true,
  ): Promise<void> => {
    entityDataUpdate.value = options.reshapeEntityData(entity);

    if (setSavedData) {
      setOriginalSavedData();
    }

    if (options.parseEntityData) {
      await options.parseEntityData(entity);
    }
  };

  const setOriginalSavedData = () => {
    originalEntityData.value = JSON.stringify(entityData.value);
  };

  // Step validation
  const validateSteps = async (
    steps: number[],
    stepValidationMap?: Record<number, string>,
  ) => {
    if (!form) return true;

    formValidation.value = await form.validate();
    const errors = Object.keys(formValidation.value.errors);
    const mapToUse = stepValidationMap || options.stepValidationMap || {};
    const stepKeys = steps.map((step) => mapToUse[step]);
    const stepErrors = errors.filter((error) =>
      stepKeys.some((stepKey) => stepKey && error.includes(stepKey)),
    );
    return stepErrors.length === 0;
  };

  // Create entity
  const createEntity = async (
    additionalValidation?: () => Promise<boolean>,
    queryOptions?: TOptions,
  ) => {
    loading.value = true;
    try {
      if (
        additionalValidation &&
        typeof additionalValidation === 'function' &&
        !(await additionalValidation())
      ) {
        validateOnChange.value = true;
        return;
      }

      const createData = options.prepareCreateData
        ? options.prepareCreateData(form.values)
        : entityDataCreate.value;

      const result = await options.repository.create(createData, queryOptions);

      if (result?._id) {
        const newUrl = newEntityUrl.replace(
          newEntityUrlAlias.value,
          result._id,
        );
        await router.replace(newUrl);

        toast({
          title: t('entity_created', { entityName }),
          variant: 'positive',
        });
      }

      return result;
    } catch (error) {
      showErrorToast(t('error_creating_entity', { entityName }));
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Update entity
  const updateEntity = async (
    additionalValidation?: () => Promise<boolean>,
    queryOptions?: TOptions,
    setSavedData?: boolean,
  ) => {
    loading.value = true;
    try {
      if (
        additionalValidation &&
        typeof additionalValidation === 'function' &&
        !(await additionalValidation())
      ) {
        validateOnChange.value = true;
        return;
      }

      const id = entityId.value;
      const updateData = options.prepareUpdateData
        ? options.prepareUpdateData(form.values, entityDataUpdate.value)
        : entityDataUpdate.value;

      if (!updateData) {
        return;
      }
      const result = await options.repository.update(
        id,
        updateData,
        queryOptions,
      );
      const newData =
        result ?? (await options.repository.get(id, queryOptions));
      await parseAndSaveData(newData, setSavedData);

      toast({
        title: t('entity_updated', { entityName }),
        variant: 'positive',
      });

      return result;
    } catch (error) {
      showErrorToast(t('error_updating_entity', { entityName }));
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Delete entity
  const deleteEntity = async (): Promise<boolean> => {
    if (!options.repository.delete) return false;

    try {
      await options.repository.delete(entityId.value);
      toast({
        title: t('entity_deleted', { entityName }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
      const _message = getErrorMessage(error);
      showErrorToast(t('entity_delete_failed', { entityName }));
      return false;
    }
  };

  return {
    // State
    entityName,
    entityId,
    createMode,
    loading,
    newEntityUrl,
    entityListUrl,
    currentTab,
    showSidebar,

    // Entity data
    refreshEntityData,
    entityLiveStatus,
    entityDataCreate,
    entityDataUpdate,
    entityData,
    entityPageTitle,
    entityFetchKey,

    // Form
    form,
    validateOnChange,
    formValidation,
    formValid,
    formTouched,

    // Unsaved changes
    hasUnsavedChanges,
    unsavedChangesDialogOpen,
    setOriginalSavedData,
    confirmLeave,

    // Methods
    parseAndSaveData,
    validateSteps,
    createEntity,
    updateEntity,
    deleteEntity,
  };
}
