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
const scope = 'pages/pim/product/new.vue';
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(scope);
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
      brandId: z.number().optional(),
      mainCategoryId: z.number().optional(),
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
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  createMode,
  loading,
  entityListUrl,
  entityDataCreate,
  entityData,
  entityPageTitle,
  form,
  formValid,
  createEntity,
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
      brandId: entityData.brandId || 0,
      mainCategoryId: entityData.mainCategoryId || 0,
    },
  }),
  parseEntityData: (entity) => {
    form.setValues({
      default: {
        name: entity.name || '',
        articleNumber: entity.articleNumber || '',
        brandId: entity.brandId || 0,
        mainCategoryId: entity.mainCategoryId || 0,
      },
    });
  },
  prepareCreateData: (formData) => ({
    ...entityBase,
    ...formData.default,
    brandId: formData.default.brandId || 0,
    mainCategoryId: formData.default.mainCategoryId || 0,
  }),
  prepareUpdateData: (formData, entity) => {
    if (!entity) return { ...entityBase, ...formData.default };
    return {
      ...entity,
      ...formData.default,
    };
  },
  onFormValuesChange: (values) => {
    entityDataCreate.value = {
      ...entityData.value,
      ...values.default,
    };
  },
});

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const handleCreate = async () => {
  // Validate form before submission
  const validation = await form.validate();
  if (!validation.valid) {
    toast({
      title: t('validation_failed'),
      description: t('please_fix_errors'),
      variant: 'negative',
    });
    return;
  }

  try {
    const result = await createEntity();
    // createEntity handles success toast and navigation
    if (result) {
      geinsLogError('Product created successfully:', result._id);
    }
  } catch (error) {
    // Error toast is already handled by createEntity
    geinsLogError('Error creating product:', error);
  }
};

// =====================================================================================
// INITIALIZE STORES
// =====================================================================================
onMounted(() => {
  productsStore.init();
});
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName" />
    </template>

    <form @submit.prevent="handleCreate">
      <ContentEditMain :show-sidebar="false">
        <ContentEditMainContent>
          <ContentEditCard
            :title="$t('create_entity', { entityName })"
            :description="$t('product_create_description')"
          >
            <FormGridWrap>
              <FormGrid design="1+1">
                <FormField v-slot="{ componentField }" name="default.name">
                  <FormItem>
                    <FormLabel>{{ $t('name') }}</FormLabel>
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
                    <FormControl>
                      <BrandSelector
                        v-bind="componentField"
                        :brands="brands"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="default.mainCategoryId">
                  <FormItem>
                    <FormLabel>{{ $t('main_category') }}</FormLabel>
                    <FormControl>
                      <Select v-bind="componentField">
                        <SelectTrigger>
                          <SelectValue :placeholder="$t('select_category')" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="category in categories"
                            :key="category._id"
                            :value="Number(category._id)"
                          >
                            {{ category.name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>
            </FormGridWrap>

            <div class="flex flex-row justify-end gap-4 mt-6">
              <Button variant="secondary" as-child>
                <NuxtLink :to="entityListUrl">
                  {{ $t('cancel') }}
                </NuxtLink>
              </Button>
              <Button
                type="submit"
                :loading="loading"
                :disabled="!formValid || loading"
              >
                {{ $t('create_entity', { entityName }) }}
              </Button>
            </div>
          </ContentEditCard>
        </ContentEditMainContent>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
