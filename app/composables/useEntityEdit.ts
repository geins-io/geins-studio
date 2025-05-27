import { useToast } from '@/components/ui/toast/use-toast';
import { useForm } from 'vee-validate';
import { useDebounceFn } from '@vueuse/core';
import type { toTypedSchema } from '@vee-validate/zod';
import type { UnwrapRef } from 'vue';

export interface EntityEditOptions<
  TBase,
  TResponse = ResponseEntity<TBase>,
  TCreate = CreateEntity<TBase>,
  TUpdate = UpdateEntity<TBase>,
  TForm = Record<string, unknown>,
> {
  entityName?: string;
  newEntityUrlAlias?: string;
  repository: {
    get: (id: string) => Promise<TResponse>;
    create: (data: TCreate) => Promise<TResponse>;
    update: (id: string, data: TUpdate) => Promise<TResponse>;
    delete?: (id: string) => Promise<void>;
  };
  validationSchema: ReturnType<typeof toTypedSchema>;
  initialEntityData: Partial<TResponse>;
  parseEntityData?: (entity: TResponse) => Promise<void> | void;
  prepareCreateData?: (formData: TForm) => TCreate;
  prepareUpdateData?: (formData: TForm, entity: TResponse) => TUpdate;
  reShapeEntityData?: (entity: TResponse) => TUpdate;
  getInitialFormValues?: (
    entityData: TCreate | TUpdate,
    createMode: boolean,
  ) => object;
  onFormValuesChange?: (
    values: TForm,
    entityDataCreate: Ref<TCreate> | Ref<UnwrapRef<TCreate>>,
    entityDataUpdate: Ref<TUpdate> | Ref<UnwrapRef<TUpdate>>,
    createMode: Ref<boolean>,
  ) => Promise<void> | void;
  debounceMs?: number;
}

export function useEntityEdit<
  TBase,
  TResponse = ResponseEntity<TBase>,
  TCreate = CreateEntity<TBase>,
  TUpdate = UpdateEntity<TBase>,
  TForm = Record<string, unknown>,
>(options: EntityEditOptions<TBase, TResponse, TCreate, TUpdate, TForm>) {
  const { t } = useI18n();
  const route = useRoute();
  const { toast } = useToast();
  const {
    newEntityUrlAlias,
    getEntityName,
    getNewEntityUrl,
    getEntityListUrl,
  } = useEntity(route.fullPath);

  // Core state
  const entityName = options.entityName || getEntityName();
  const newEntityUrl = getNewEntityUrl();
  const entityListUrl = getEntityListUrl();
  const entityId = ref<string>(String(route.params.id));
  const createMode = ref(
    route.params.id === (options.newEntityUrlAlias || newEntityUrlAlias),
  );
  const loading = ref(false);

  // Entity data - maintain the same pattern as account edit
  const entityDataCreate = ref<TCreate>({
    ...(options.initialEntityData as TCreate),
  });
  const entityDataUpdate = ref<TUpdate>({
    ...(options.initialEntityData as TUpdate),
  });
  const entityData = computed<TCreate | TUpdate>(() =>
    createMode.value ? entityDataCreate.value : entityDataUpdate.value,
  );

  // Original data tracking for unsaved changes
  const originalEntityData = ref<string>('');

  // Unsaved changes integration
  const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
    useUnsavedChanges(entityDataUpdate, originalEntityData, createMode);

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
  if (form && options.onFormValuesChange) {
    watch(
      form.values,
      useDebounceFn(async (values) => {
        if (validateOnChange.value && form) {
          await form.validate();
        }

        if (options.onFormValuesChange) {
          await options.onFormValuesChange(
            values,
            entityDataCreate,
            entityDataUpdate,
            createMode,
          );
        }
      }, options.debounceMs || 500),
      { deep: true },
    );
  }

  // Parse and save data helper
  const parseAndSaveData = async (entity: TResponse): Promise<void> => {
    if (options.reShapeEntityData) {
      entityDataUpdate.value = options.reShapeEntityData(entity);
    } else {
      entityDataUpdate.value = { ...entity };
    }
    originalEntityData.value = JSON.stringify(entityDataUpdate.value);

    if (options.parseEntityData) {
      await options.parseEntityData(entity);
    }
  };

  // Step validation
  const validateSteps = async (
    steps: number[],
    stepValidationMap: Record<number, string>,
  ) => {
    if (!form) return true;

    formValidation.value = await form.validate();
    const errors = Object.keys(formValidation.value.errors);
    const stepKeys = steps.map((step) => stepValidationMap[step]);
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
      if (additionalValidation && !(await additionalValidation())) {
        validateOnChange.value = true;
        return;
      }

      const createData = options.prepareCreateData
        ? options.prepareCreateData(form.values)
        : entityDataCreate.value;

      const result = await options.repository.create(createData);
      const id = result._id;

      if (id) {
        const newUrl = newEntityUrl.replace(
          options.newEntityUrlAlias || newEntityUrlAlias,
          id,
        );
        await useRouter().replace(newUrl);
      }

      toast({
        title: t('entity_created', { entityName }),
        variant: 'positive',
      });

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
  ) => {
    loading.value = true;
    try {
      if (additionalValidation && !(await additionalValidation())) {
        validateOnChange.value = true;
        return;
      }

      const id = entityDataUpdate.value._id || entityId.value;
      const updateData = options.prepareUpdateData
        ? options.prepareUpdateData(form.values, entityDataUpdate.value)
        : entityDataUpdate.value;

      const result = await options.repository.update(id, updateData);
      await parseAndSaveData(result);

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
  const deleteEntity = async () => {
    if (!options.repository.delete) return false;

    try {
      await options.repository.delete(entityId.value);
      toast({
        title: t('entity_deleted', { entityName }),
        variant: 'positive',
      });
      return true;
    } catch (error) {
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
    entityDataCreate,
    entityDataUpdate,
    entityData,

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
