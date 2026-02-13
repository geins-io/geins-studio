# Page Templates

Annotated templates for creating new list and detail/edit pages. Copy the relevant template and replace placeholders (`{Entity}`, `{entity}`, `{domain}`).

## List Page Template

File: `app/pages/{domain}/{entity}/list.vue`

```vue
<script setup lang="ts">
// === 1. IMPORTS & TYPE ALIASES ===
import type { ColumnOptions, StringKeyOf } from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
// Import your domain entity types
import type { {Entity}Response } from '#shared/types';

// Define local aliases for readability
type Entity = {Entity}Response;
type EntityList = {Entity}Response; // May extend with computed display fields

// === 2. SCOPE & COMPOSABLES ===
const scope = '{entity}-list';
const { t } = useI18n();
const { geinsLog, geinsLogError } = useGeinsLog(scope);
const { getEntityUrl } = useEntityUrl();

// === 3. PAGE META ===
definePageMeta({
  pageType: 'list', // Triggers overflow-hidden in default layout
});

// === 4. GLOBAL SETUP ===
const { {domain}Api } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = t('{entity}');
const newEntityUrl = getEntityUrl('{entity}', 'new');
const entityIdentifier = '{id}';
const entityUrl = '{entity}';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

// === 5. ERROR HANDLING ===
const { handleFetchResult, showErrorToast } = usePageError({
  entityName,
  entityList: true,
  scope,
});

// === 6. DATA TRANSFORM ===
function mapToListData(items: Entity[]): EntityList[] {
  return items.map((item) => ({
    ...item,
    // Add computed display fields if needed
  }));
}

// === 7. FETCH DATA ===
const { data, error, refresh } = await useAsyncData<Entity[]>(
  `${scope}`,
  () => {domain}Api.list(/* { fields: [...] } */),
);

// === 8. COLUMNS ===
const { getColumns, addActionsColumn } = useColumns<EntityList>();

// === 9. ON MOUNTED ===
onMounted(() => {
  // Watch data and transform
  watch(data, (newData) => {
    if (!newData) return;
    const result = handleFetchResult(newData);
    if (result) {
      dataList.value = mapToListData(result);
    }
  }, { immediate: true });

  // Define columns
  const columnOptions: ColumnOptions<EntityList>[] = [
    { key: 'name', label: t('name'), sortable: true },
    // Add more columns...
  ];
  columns.value = getColumns(columnOptions) as ColumnDef<EntityList>[];
  addActionsColumn(columns.value, entityUrl, entityIdentifier);

  loading.value = false;
});

// === 10. COLUMN VISIBILITY ===
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [/* columns hidden by default */];
visibilityState.value = getVisibilityState(hiddenColumns);

// === 11. DELETE LOGIC ===
const deleteDialogOpen = ref(false);
const deleting = ref(false);
const deleteId = ref<number | null>(null);

function openDeleteDialog(id: number) {
  deleteId.value = id;
  deleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    await {domain}Api.delete(deleteId.value);
    await refresh();
  } catch (e) {
    geinsLogError('Delete failed', e);
    showErrorToast();
  } finally {
    deleting.value = false;
    deleteDialogOpen.value = false;
  }
}
</script>

<template>
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :deleting="deleting"
    @confirm="confirmDelete"
  />

  <ContentHeader :title="entityName">
    <ContentActionBar>
      <ButtonIcon icon="new" :label="t('new')" :href="newEntityUrl" />
    </ContentActionBar>
  </ContentHeader>

  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
    >
      <template #empty-actions>
        <ButtonIcon icon="new" variant="secondary" :href="newEntityUrl" />
      </template>
    </TableView>
    <template #error="{ error: errorCatched }">
      <h2>{{ t('error_loading_entity', { entityName }) }}</h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
```

## Detail/Edit Page Template

File: `app/pages/{domain}/{entity}/[id].vue`

```vue
<script setup lang="ts">
// === IMPORTS & TYPES ===
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import type {
  {Entity}Base,
  {Entity}Response,
  {Entity}Create,
  {Entity}Update,
} from '#shared/types';

// === COMPOSABLES & STORES ===
const scope = '{entity}-edit';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLog, geinsLogError } = useGeinsLog(scope);
const accountStore = useAccountStore();
const breadcrumbsStore = useBreadcrumbsStore();

// === API & REPOSITORY ===
const { {domain}Api } = useGeinsRepository();

// === FORM VALIDATION SCHEMA ===
// Group fields by create-mode steps for stepValidationMap
const validationSchema = toTypedSchema(
  z.object({
    // Step 1 fields (required for create)
    details: z.object({
      name: z.string().min(1),
      // ...more fields
    }),
    // Step 2 fields (optional or secondary)
    settings: z.object({
      // ...
    }),
  }),
);

// === ENTITY DATA SETUP ===
// Template for new entity creation
const entityBase: {Entity}Create = {
  name: '',
  active: false,
  // ...default values matching the create payload
};

// === UI STATE ===
const tabs = [t('general'), t('details') /* , ...more tabs */];
const totalCreateSteps = 2;
const { currentStep, nextStep, previousStep } = useStepManagement(totalCreateSteps);
const stepValidationMap: Record<number, string> = {
  1: 'details',   // Maps step 1 to Zod schema group 'details'
  2: 'settings',  // Maps step 2 to Zod schema group 'settings'
};

// === ENTITY EDIT COMPOSABLE ===
const {
  entityName,
  entityId,
  createMode,
  loading,
  newEntityUrl,
  entityListUrl,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  form,
  formValid,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
} = useEntityEdit<{Entity}Base, {Entity}Response, {Entity}Create, {Entity}Update>({
  repository: {domain}Api,
  validationSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  // Transform API response → form shape
  reshapeEntityData: (entity) => ({
    details: { name: entity.name /* ...map fields */ },
    settings: { /* ... */ },
  }),
  // Side effects on entity load (e.g., set breadcrumbs)
  parseEntityData: (entity) => {
    breadcrumbsStore.titleOverride = entity.name;
  },
  // Transform form → create payload
  prepareCreateData: (formData) => ({
    ...entityDataCreate.value,
    name: formData.details.name,
    // ...map form fields to API shape
  }),
  // Transform form → update payload
  prepareUpdateData: (formData, entity) => ({
    ...entityDataUpdate.value,
    name: formData.details.name,
    // ...map form fields to API shape
  }),
  // Reactive sync: form changes → entity data refs
  onFormValuesChange: (values) => {
    if (createMode.value) {
      entityDataCreate.value.name = values.details?.name ?? '';
    } else {
      entityDataUpdate.value.name = values.details?.name ?? '';
    }
  },
});

// === SAVE HANDLER ===
async function handleSave() {
  await updateEntity();
}

// === DELETE ===
const deleteDialogOpen = ref(false);
async function confirmDelete() {
  await deleteEntity();
  router.push(entityListUrl);
}

// === SUMMARY PROPS (sidebar) ===
const summaryProps = computed(() => ({
  entityName: entityName.value,
  id: entityId.value,
  // ...metadata for ContentEditSummary
}));
</script>

<template>
  <!-- Dialogs at root level -->
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    @confirm="confirmDelete"
  />

  <ContentEditWrap>
    <!-- Header -->
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :disabled="!hasUnsavedChanges"
            @click="handleSave"
          />
          <DropdownMenu v-if="!createMode">
            <!-- New, Delete actions -->
          </DropdownMenu>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>

    <!-- Form -->
    <form @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <!-- Tab 0: General (always visible) -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <!-- Step 1 -->
            <ContentEditCard
              :create-mode="createMode"
              :step="1"
              :total-steps="totalCreateSteps"
              :current-step="currentStep"
              :step-valid="formValid"
              :title="t('details')"
              @next="nextStep"
              @previous="previousStep"
            >
              <FormGridWrap>
                <FormGrid design="1+1+1">
                  <FormField v-slot="{ componentField }" name="details.name">
                    <FormItem>
                      <FormLabel>{{ t('name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <!-- More fields... -->
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>

            <!-- Create mode: action buttons -->
            <div v-if="createMode" class="flex flex-row justify-end gap-4">
              <Button variant="secondary" as-child>
                <NuxtLink :to="entityListUrl">{{ t('cancel') }}</NuxtLink>
              </Button>
              <Button :disabled="!formValid || loading" @click="createEntity">
                {{ t('create') }}
              </Button>
            </div>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Tab 1+: Edit mode only -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard :title="t('details')">
              <!-- Tab-specific content -->
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Sidebar -->
        <template #sidebar>
          <ContentEditSummary
            v-model:active="entityDataUpdate.active"
            v-bind="summaryProps"
          />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
```

## Key Conventions

- **Create mode** (`route.params.id === 'new'`): Only tab 0 is shown with step-based cards. Tabs, sidebar, and save button are hidden.
- **Tabs**: Each wrapped in `<KeepAlive>` with `v-if="currentTab === N"` and `:key` for cache isolation.
- **Form fields**: Always use `<FormField v-slot="{ componentField }">` → `<FormItem>` → `<FormControl>` → input component.
- **Grid layouts**: `<FormGridWrap>` → `<FormGrid design="1+1+1">` (3-col) or `design="1"` (full-width).
- **Dialogs**: Rendered at root level, before `<ContentEditWrap>`.
- **Error handling**: `useGeinsLog(scope)` for dev logging; `useToast()` for user-facing errors.
