<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import type { Product, ProductCreate, ProductUpdate, ProductApiOptions } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/pim/product/[id].vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(scope);
const breadcrumbsStore = useBreadcrumbsStore();
const productsStore = useProductsStore();
const { brands, categories } = storeToRefs(productsStore);

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { productApi } = useGeinsRepository();

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z.object({
    default: z.object({
      name: z.string().min(1, t('entity_required', { entityName: 'name' })),
      articleNumber: z.string().min(1, t('entity_required', { entityName: 'article number' })),
      active: z.boolean().optional(),
      brandId: z.number().optional(),
      description: z.string().optional(),
      categoryIds: z.array(z.number()).optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: ProductCreate = {
  productId: 0,
  name: '',
  articleNumber: '',
  dateCreated: '',
  dateUpdated: '',
  dateFirstAvailable: '',
  dateActivated: '',
  maxDiscountPercentage: 0,
  active: false,
  purchasePrice: 0,
  purchasePriceCurrency: 'SEK',
  brandId: 0,
  supplierId: 0,
  freightClassId: 0,
  intrastatCode: '',
  countryOfOrigin: '',
  externalProductId: '',
  mainCategoryId: 0,
  defaultPrice: {
    sellingPriceIncVat: 0,
    sellingPriceExVat: 0,
    regularPriceIncVat: 0,
    regularPriceExVat: 0,
    vatRate: 0,
  },
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Define the six tabs as required
const tabs = [
  t('general'),
  t('variants'),
  t('pricing'),
  t('stock'),
  t('images'),
  t('seo'),
];

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
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
  entityFetchKey,
  refreshEntityData,
  form,
  formValid,
  formTouched,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
} = useEntityEdit<
  ProductCreate,
  Product,
  ProductCreate,
  ProductUpdate,
  ProductApiOptions
>({
  repository: productApi,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  reshapeEntityData: (entityData) => entityData,
  getInitialFormValues: (entityData) => ({
    default: {
      name: entityData.name || '',
      articleNumber: entityData.articleNumber || '',
      active: entityData.active || false,
      brandId: entityData.brandId || 0,
      description: (entityData.localizations?.['en'] as any)?.text1 || '',
      categoryIds: entityData.categories?.map(c => Number(c._id)) || [],
    },
  }),
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    form.setValues({
      default: {
        name: entity.name || '',
        articleNumber: entity.articleNumber || '',
        active: entity.active || false,
        brandId: entity.brandId || 0,
        description: (entity.localizations?.['en'] as any)?.text1 || '',
        categoryIds: entity.categories?.map(c => Number(c._id)) || [],
      },
    });
  },
  prepareCreateData: (formData) => ({
    ...entityBase,
    ...formData.default,
    localizations: {
      en: {
        text1: formData.default.description || '',
      },
    },
  }),
  prepareUpdateData: (formData, entity) => {
    if (!entity) return { ...entityBase, ...formData.default };
    return {
      ...entity,
      ...formData.default,
      localizations: {
        ...entity.localizations,
        en: {
          ...entity.localizations?.['en'],
          text1: formData.default.description || '',
        },
      },
    };
  },
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...entityData.value,
      ...values.default,
    };
  },
});

// =====================================================================================
// ERROR HANDLING SETUP
// =====================================================================================
const { handleFetchResult, showErrorToast } = usePageError({
  entityName,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const handleSave = async () => {
  try {
    await updateEntity();
    toast({
      title: t('entity_saved', { entityName }),
      variant: 'positive',
    });
  } catch (error) {
    geinsLogError('error saving entity:', error);
    showErrorToast(t('error_saving_entity', { entityName }));
  }
};

// =====================================================================================
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/pim/product/list');

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];

  if (!createMode.value && entityData.value?.productId) {
    dataList.push({
      label: t('entity_id', { entityName }),
      value: String(entityData.value.productId),
      displayType: DataItemDisplayType.Copy,
    });
  }

  if (entityData.value?.name) {
    dataList.push({
      label: t('entity_name', { entityName }),
      value: entityData.value.name,
    });
  }

  if (entityData.value?.articleNumber) {
    dataList.push({
      label: t('article_number'),
      value: entityData.value.articleNumber,
    });
  }

  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => []);

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
});

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<Product>(
    entityFetchKey.value,
    () => productApi.get(entityId.value),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    const product = handleFetchResult<Product>(error.value, data.value);
    await parseAndSaveData(product, true);
  });
}
</script>

<template>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="loading"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges"
            @click="handleSave"
          >
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button class="p-1" size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink :to="newEntityUrl">
                  <LucidePlus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
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

    <form @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <!-- General Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :title="$t('product_general_info')"
              :description="$t('product_general_info_description')"
            >
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="default.name">
                    <FormItem>
                      <FormLabel>{{ $t('entity_name', { entityName }) }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="default.articleNumber">
                    <FormItem>
                      <FormLabel>{{ $t('article_number') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="default.brandId">
                    <FormItem>
                      <FormLabel>{{ $t('brand') }}</FormLabel>
                      <Select v-bind="componentField">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue :placeholder="$t('select_brand')" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            v-for="brand in brands"
                            :key="brand._id"
                            :value="String(brand._id)"
                          >
                            {{ brand.name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="default.categoryIds">
                    <FormItem>
                      <FormLabel>{{ $t('categories') }}</FormLabel>
                      <FormControl>
                        <TagsInput
                          :model-value="(componentField.modelValue || []).map((id: number) => String(id))"
                          @update:model-value="(val: any) => componentField['onUpdate:modelValue']?.(val.map((v: any) => Number(v)))"
                        >
                          <TagsInputItem
                            v-for="categoryId in (componentField.modelValue || [])"
                            :key="categoryId"
                            :value="String(categoryId)"
                          >
                            <TagsInputItemText>
                              {{ categories.find(c => Number(c._id) === categoryId)?.name || categoryId }}
                            </TagsInputItemText>
                            <TagsInputItemDelete />
                          </TagsInputItem>
                          <ComboboxRoot
                            :model-value="(componentField.modelValue || []).map((id: number) => String(id))"
                            @update:model-value="(val: any) => componentField['onUpdate:modelValue']?.(val.map((v: any) => Number(v)))"
                            multiple
                          >
                            <ComboboxAnchor as-child>
                              <ComboboxInput as-child>
                                <TagsInputInput :placeholder="$t('select_categories')" />
                              </ComboboxInput>
                            </ComboboxAnchor>
                            <ComboboxContent>
                              <ComboboxViewport>
                                <ComboboxEmpty>{{ $t('no_results') }}</ComboboxEmpty>
                                <ComboboxItem
                                  v-for="category in categories"
                                  :key="category._id"
                                  :value="String(category._id)"
                                >
                                  <ComboboxItemIndicator />
                                  {{ category.name }}
                                </ComboboxItem>
                              </ComboboxViewport>
                            </ComboboxContent>
                          </ComboboxRoot>
                        </TagsInput>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="default.description">
                    <FormItem>
                      <FormLabel>{{ $t('description') }}</FormLabel>
                      <FormControl>
                        <Textarea v-bind="componentField" rows="4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Variants Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :title="$t('variants')"
              :description="$t('product_variants_description')"
            >
              <ProductVariantsTable
                :skus="entityData?.skus || []"
                :loading="loading"
              />
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Pricing Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 2"
            :key="`tab-${currentTab}`"
          >
            <ContentCard>
              <ContentCardHeader
                :title="$t('pricing')"
                :description="$t('product_pricing_description')"
                size="lg"
              />
              <p class="text-muted-foreground text-sm">
                {{ $t('pricing_content_placeholder') }}
              </p>
            </ContentCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Stock Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 3"
            :key="`tab-${currentTab}`"
          >
            <ContentCard>
              <ContentCardHeader
                :title="$t('stock')"
                :description="$t('product_stock_description')"
                size="lg"
              />
              <p class="text-muted-foreground text-sm">
                {{ $t('stock_content_placeholder') }}
              </p>
            </ContentCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Images Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 4"
            :key="`tab-${currentTab}`"
          >
            <ContentCard>
              <ContentCardHeader
                :title="$t('images')"
                :description="$t('product_images_description')"
                size="lg"
              />
              <p class="text-muted-foreground text-sm">
                {{ $t('images_content_placeholder') }}
              </p>
            </ContentCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- SEO Tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 5"
            :key="`tab-${currentTab}`"
          >
            <ContentCard>
              <ContentCardHeader
                :title="$t('seo')"
                :description="$t('product_seo_description')"
                size="lg"
              />
              <p class="text-muted-foreground text-sm">
                {{ $t('seo_content_placeholder') }}
              </p>
            </ContentCard>
          </ContentEditMainContent>
        </KeepAlive>

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
