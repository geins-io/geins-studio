import { useToast } from '@/components/ui/toast/use-toast';
import { useForm } from 'vee-validate';
import { useDebounceFn } from '@vueuse/core';

export interface EntityEditOptions<T, C, U, B> {
  entityName: string;
  newEntityUrlAlias?: string;
  repository: {
    get: (id: string) => Promise<T>;
    create: (data: C) => Promise<T>;
    update: (id: string, data: U) => Promise<T>;
    delete?: (id: string) => Promise<void>;
  };
  validationSchema?: any;
  initialEntityData: C | U;
  parseEntityData?: (entity: T) => Promise<void> | void;
  prepareCreateData?: (formData: any) => C;
  prepareUpdateData?: (formData: any, entity: T) => U;
  reShapeEntityData?: (entity: T) => C | U;
  getInitialFormValues?: (entityData: C | U, createMode: boolean) => any;
}

export function useEntityEdit<T extends EntityBase, C, U, B>(
  options: EntityEditOptions<T, C, U, B>,
) {
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
  const entityDataCreate = ref<C>({ ...options.initialEntityData });
  const entityDataUpdate = ref<U>({ ...options.initialEntityData });
  const entityData = computed(() =>
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
  const form = options.validationSchema
    ? useForm({
        validationSchema: options.validationSchema,
        initialValues: options.getInitialFormValues
          ? options.getInitialFormValues(entityData.value, createMode.value)
          : {},
      })
    : null;

  // Title computation
  const title = computed(() =>
    createMode.value
      ? t('new_entity', { entityName }) +
        (entityData.value?.name ? ': ' + entityData.value.name : '')
      : entityData.value?.name || t('edit_entity', { entityName }),
  );

  // Parse and save data helper
  const parseAndSaveData = async (entity: T): Promise<void> => {
    let data = entity;
    if (options.reShapeEntityData) {
      data = options.reShapeEntityData(entity);
    }
    entityDataUpdate.value = { ...data };
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
        ? options.prepareCreateData(form?.values || {})
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
        ? options.prepareUpdateData(form?.values || {}, entityDataUpdate.value)
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
    title,
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
