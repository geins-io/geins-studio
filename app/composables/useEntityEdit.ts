import { useToast } from '@/components/ui/toast/use-toast';
import { useForm, type GenericObject } from 'vee-validate';
import { useDebounceFn } from '@vueuse/core';
import type { toTypedSchema } from '@vee-validate/zod';

export interface EntityEditOptions<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
> {
  entityName?: string;
  newEntityUrlAlias?: string;
  repository: {
    get: (id: string, query?: Record<string, string>) => Promise<TResponse>;
    create: (data: TCreate) => Promise<TResponse>;
    update: (id: string, data: TUpdate) => Promise<TResponse>;
    delete?: (id: string) => Promise<void>;
  };
  validationSchema: ReturnType<typeof toTypedSchema>;
  initialEntityData: TCreate;
  initialUpdateData: TUpdate;
  excludeSaveFields: StringKeyOf<TBase>[];
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

export function useEntityEdit<
  TBase,
  TResponse extends ResponseEntity<TBase>,
  TCreate extends CreateEntity<TBase>,
  TUpdate extends UpdateEntity<TBase>,
>(options: EntityEditOptions<TBase, TResponse, TCreate, TUpdate>) {
  const { t } = useI18n();
  const route = useRoute();
  const { toast } = useToast();
  const {
    newEntityUrlAlias,
    getEntityName,
    getNewEntityUrl,
    getEntityListUrl,
  } = useEntityUrl(route.fullPath);

  // Core state
  const entityName = options.entityName || getEntityName();
  const newEntityUrl = getNewEntityUrl();
  const entityListUrl = getEntityListUrl();
  const createMode = ref(
    route.params.id === (options.newEntityUrlAlias || newEntityUrlAlias),
  );
  const loading = ref(false);
  const refreshEntityData = ref<() => Promise<void>>(() => Promise.resolve());
  const entityLiveStatus = ref<boolean>(false);

  // Entity data
  const entityDataCreate = ref<TCreate>(options.initialEntityData);
  const entityDataUpdate = ref<TUpdate>(options.initialUpdateData);
  const entityData = computed(() =>
    createMode.value ? entityDataCreate.value : entityDataUpdate.value,
  );

  const entityId = computed<string>(
    () => entityData.value?._id || String(route.params.id),
  );

  const entityPageTitle = computed(() =>
    createMode.value
      ? t('new_entity', { entityName }) +
        (entityData.value?.name ? ': ' + entityData.value.name : '')
      : entityData.value?.name || t('edit_entity', { entityName }),
  );

  // Original data tracking for unsaved changes
  const originalEntityData = ref<string>('');

  // Unsaved changes integration
  const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
    useUnsavedChanges(
      entityDataUpdate,
      originalEntityData,
      createMode,
      options.excludeSaveFields,
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
  const parseAndSaveData = async (entity: TResponse): Promise<void> => {
    entityDataUpdate.value = options.reshapeEntityData(entity);

    originalEntityData.value = JSON.stringify(entityDataUpdate.value);

    if (options.parseEntityData) {
      await options.parseEntityData(entity);
    }
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

      const result = await options.repository.create(createData);

      if (result?._id) {
        const newUrl = newEntityUrl.replace(
          options.newEntityUrlAlias || newEntityUrlAlias,
          result._id,
        );
        await useRouter().replace(newUrl);

        toast({
          title: t('entity_created', { entityName }),
          variant: 'positive',
        });
      }

      return result;
    } catch (error) {
      toast({
        title: t('error_creating_entity', { entityName }),
        description: t('feedback_error_description'),
        variant: 'negative',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Update entity
  const updateEntity = async (
    additionalValidation?: () => Promise<boolean>,
    query?: Record<string, string>,
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
      const result = await options.repository.update(id, updateData);
      const newData = result ?? (await options.repository.get(id, query));
      await parseAndSaveData(newData);

      toast({
        title: t('entity_updated', { entityName }),
        variant: 'positive',
      });

      return result;
    } catch (error) {
      toast({
        title: t('error_updating_entity', { entityName }),
        description: t('feedback_error_description'),
        variant: 'negative',
      });
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
      toast({
        title: t('entity_delete_failed', { entityName }),
        variant: 'negative',
      });
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

    // Entity data
    refreshEntityData,
    entityLiveStatus,
    entityDataCreate,
    entityDataUpdate,
    entityData,
    entityPageTitle,

    // Form
    form,
    validateOnChange,
    formValidation,
    formValid,
    formTouched,

    // Unsaved changes
    hasUnsavedChanges,
    unsavedChangesDialogOpen,
    confirmLeave,

    // Methods
    parseAndSaveData,
    validateSteps,
    createEntity,
    updateEntity,
    deleteEntity,
  };
}
