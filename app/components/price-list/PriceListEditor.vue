<script setup lang="ts">
import { TableMode, SelectorSelectionStrategy } from '#shared/types';
import type { UsePriceListEditorReturnType } from '@/composables/pricing/usePriceListEditor';

const props = defineProps<{
  editor: UsePriceListEditorReturnType;
}>();

const { products } = storeToRefs(useProductsStore());

// One editor per mount, so its refs can be unwrapped as top-level bindings.
const {
  readOnly,
  priceListId,
  listPriceTitle,
  currency,
  vatDescription,
  productSelection,
  productSelector,
  editedProducts,
  selectedProducts,
  hasProductSelection,
  columns,
  pinnedState,
  seedVersion,
  readOnlyRowsLoading,
  readOnlyRowsError,
  loadReadOnlyRows,
  volumePricingOpen,
  volumePricingProduct,
  priceListBaseRuleMode,
  priceListBaseRuleInput,
  baseRule,
  baseRuleMode,
  baseRulePercentage,
  baseRuleText,
  baseRuleLoading,
  handleApplyBaseRule,
  handleApplyBaseRuleAndOverwrite,
  removeBaseRule,
  quantityLevelRules,
  volumePricingLoading,
  priceListRulesMode,
  applyRule,
  applyAndOverwriteRule,
  removeRule,
  rulesToEdit,
  rulesPanelOpen,
  rulesProductId,
  rulesProductName,
  rulesProduct,
  handleSaveRules,
  overwriteBaseRulePromptVisible,
  overwriteLevelsPromptVisible,
  currentOverwriteQuantity,
  overwriteContinueAction,
  removeBaseRulePromptVisible,
  rulesModeChangePrompt,
  pendingModeChange,
  confirmModeChange,
  cancelModeChange,
} = props.editor;
</script>

<template>
  <AlertDialog v-model:open="rulesModeChangePrompt">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t('dialog.price_breaks_removed_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('dialog.price_breaks_removed_description', {
              mode: pendingModeChange,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelModeChange">
          {{ $t('cancel') }}
        </AlertDialogCancel>

        <Button @click.prevent.stop="confirmModeChange">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="overwriteBaseRulePromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t('dialog.product_prices_overwrite_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('dialog.product_prices_overwrite_description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="overwriteBaseRulePromptVisible = false">
          {{ $t('cancel') }}
        </AlertDialogCancel>

        <Button @click.prevent.stop="overwriteContinueAction">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="overwriteLevelsPromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t('dialog.volume_pricing_overwrite_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('dialog.volume_pricing_overwrite_description', {
              quantity: currentOverwriteQuantity,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="overwriteLevelsPromptVisible = false">
          {{ $t('cancel') }}
        </AlertDialogCancel>

        <Button @click.prevent.stop="overwriteContinueAction">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="removeBaseRulePromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{
            $t('dialog.global_rule_remove_title', { ruleMode: baseRuleMode })
          }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('dialog.global_rule_remove_description', {
              ruleMode: baseRuleMode,
              percentage: baseRulePercentage,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="removeBaseRulePromptVisible = false">
          {{ $t('cancel') }}
        </AlertDialogCancel>

        <Button @click.prevent.stop="removeBaseRule">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <PriceListVolumePricingPanel
    v-if="readOnly"
    v-model:open="volumePricingOpen"
    readonly
    :rules="volumePricingProduct?.volumePricing ?? []"
    :product="volumePricingProduct"
    :product-id="volumePricingProduct?._id ?? ''"
    :product-name="volumePricingProduct?.name ?? ''"
    :price-list-id="priceListId"
    :currency="currency"
    :vat-description="vatDescription"
    :list-price-title="listPriceTitle"
    :description="$t('pricing.price_list_readonly_breaks_description')"
  />
  <PriceListVolumePricingPanel
    v-else
    v-model:open="rulesPanelOpen"
    v-model:price-list-products="editedProducts"
    :product="rulesProduct"
    :product-id="rulesProductId"
    :product-name="rulesProductName"
    :price-list-id="priceListId"
    :rules="rulesToEdit"
    :currency="currency"
    :vat-description="vatDescription"
    @save="handleSaveRules"
  />

  <!-- An ERP list only has imported rows, so rules and a selection add nothing. -->
  <ContentCard v-if="readOnly">
    <TableView
      :columns="columns"
      :data="selectedProducts"
      entity-key="product"
      :mode="TableMode.Simple"
      :page-size="15"
      :pinned-state="pinnedState"
      :show-search="true"
      :loading="readOnlyRowsLoading"
      :error="!!readOnlyRowsError"
      :on-retry="loadReadOnlyRows"
    />
  </ContentCard>
  <div v-else class="flex flex-col gap-8">
    <ContentCard>
      <ContentCardHeader
        :title="$t('pricing.price_list_global_rules_title')"
        :description="$t('pricing.price_list_global_rules_description')"
        size="lg"
        class="mb-6"
      />
      <div>
        <Tabs v-auto-animate default-value="base-rule" class="relative">
          <TabsList
            :class="
              cn(
                'mb-3',
                !hasProductSelection && 'pointer-events-none opacity-60',
              )
            "
          >
            <TabsTrigger value="base-rule">
              {{ $t('pricing.price_list_base_rule') }}
            </TabsTrigger>
            <TabsTrigger value="qty-levels">
              {{ $t('pricing.price_list_volume_pricing') }}
            </TabsTrigger>
          </TabsList>
          <TabsContent v-if="hasProductSelection" value="base-rule">
            <PriceListRulesWrapper
              v-model:mode="priceListBaseRuleMode"
              :title="$t('pricing.price_list_base_rule')"
              mode-id="priceListBaseRuleMode"
            >
              <Label class="w-full">
                {{ $t(priceListBaseRuleMode) }}
              </Label>
              <Input
                v-model.number="priceListBaseRuleInput"
                class="w-full sm:w-48"
                size="md"
                :loading="baseRuleLoading"
              >
                <template #valueDescriptor>%</template>
              </Input>
              <Button variant="outline" @click="handleApplyBaseRule">
                {{ $t('apply') }}
              </Button>
              <Button
                variant="outline"
                @click="handleApplyBaseRuleAndOverwrite"
              >
                {{ $t('pricing.price_list_apply_overwrite') }}
              </Button>
              <template #footer>
                <SelectorTag
                  v-if="baseRule && baseRuleText && !baseRuleLoading"
                  class="mt-2"
                  :label="baseRuleText"
                  @remove="removeBaseRulePromptVisible = true"
                />
              </template>
            </PriceListRulesWrapper>
          </TabsContent>
          <TabsContent v-if="hasProductSelection" value="qty-levels">
            <PriceListRulesWrapper
              v-model:mode="priceListRulesMode"
              :title="$t('pricing.price_list_volume_pricing')"
              mode-id="priceListRulesMode"
            >
              <PriceListRules
                v-model:loading="volumePricingLoading"
                :rules="quantityLevelRules"
                :mode="priceListRulesMode"
                @apply="applyRule"
                @apply-overwrite="applyAndOverwriteRule"
                @remove="removeRule"
              />
            </PriceListRulesWrapper>
          </TabsContent>
        </Tabs>
        <p
          v-if="!hasProductSelection"
          class="text-muted-foreground text-sm italic"
        >
          {{ $t('pricing.price_list_rules_available_after_selection') }}
        </p>
      </div>
    </ContentCard>
    <ContentCard>
      <Selector
        ref="productSelector"
        :key="seedVersion"
        v-model:selection="productSelection"
        :entities="products"
        :selection-strategy="SelectorSelectionStrategy.None"
        :currency="currency"
        :fetch-entities-externally="true"
      >
        <template #list="{ selectorEntityKey }">
          <ContentHeading>
            {{ $t('selected_entity', { entityKey: selectorEntityKey }, 2) }}
          </ContentHeading>
          <TableView
            :columns="columns"
            :data="selectedProducts"
            :entity-key="selectorEntityKey"
            :empty-text="
              $t('no_entity_selected', { entityKey: selectorEntityKey }, 2)
            "
            :empty-description="$t('selector_browse_description')"
            :mode="TableMode.Simple"
            :page-size="15"
            :pinned-state="pinnedState"
            :show-search="true"
          />
        </template>
      </Selector>
    </ContentCard>
  </div>
</template>
