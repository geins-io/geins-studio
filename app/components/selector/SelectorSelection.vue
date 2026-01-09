<script setup lang="ts">
import type {
  CompareCondition,
  SelectorSelectionInternal,
} from '#shared/types';
import {
  SelectorMode,
  SelectorCondition,
  SelectorSelectionType,
  SelectorSelectionStrategy,
} from '#shared/types';

// PROPS
const props = withDefaults(
  defineProps<{
    currency?: string;
    type: SelectorSelectionType;
    entityName: string;
    mode: SelectorMode;
    entities: SelectorEntity[];
    selectionStrategy?: SelectorSelectionStrategy;
  }>(),
  {},
);

// TWO-WAY BINDING FOR SELECTION VIA V-MODEL
const selection = defineModel<SelectorSelectionInternal>('selection', {
  required: true,
});

// GLOBALS
const { t } = useI18n();
const { getCategoryName, getBrandName } = useProductsStore();
const currentCurrency = toRef(props, 'currency');
const entityName = toRef(props, 'entityName');
const entities = toRef(props, 'entities');
const mode = toRef(props, 'mode');
const selectionStrategy = toRef(props, 'selectionStrategy');
const type = toRef(props, 'type');
const entityIsProduct = computed(() => entityName.value === 'product');
const selectorOptions: Ref<SelectorSelectionOption[]> = computed(() => {
  const options = [
    {
      id: 'product',
      group: 'ids',
      label: t(entityName.value, 2),
    },
    {
      id: 'entity',
      group: 'ids',
      label: t(entityName.value, 2),
    },
    {
      id: 'category',
      group: 'categoryIds',
      label: t('category', 2),
    },
    {
      id: 'brand',
      group: 'brandIds',
      label: t('brand', 2),
    },
    // {
    //   id: 'price',
    //   group: 'price',
    //   label: t('price'),
    // },
    // {
    //   id: 'stock',
    //   group: 'stock',
    //   label: t('stock'),
    // },
    // {
    //   id: 'import',
    //   group: 'ids',
    //   label: t('import'),
    // },
  ];

  const filteredOptions =
    mode.value === SelectorMode.Simple
      ? options.filter(
          (o) => o.id === (entityIsProduct.value ? 'product' : 'entity'),
        )
      : options.filter(
          (o) => o.id !== (entityIsProduct.value ? 'entity' : 'product'),
        );

  return filteredOptions as SelectorSelectionOption[];
});

const activeConditionTypes = computed(() => {
  let active = 0;
  Object.keys(selection.value).forEach((key) => {
    if (
      key !== 'condition' &&
      key !== 'ids' &&
      selection.value[key as keyof SelectorSelectionInternal]?.length
    ) {
      active++;
    }
  });
  return active;
});

// WATCHERS TO KEEP GLOBALS IN SYNC
watch(activeConditionTypes, (newVal) => {
  if (newVal <= 1) {
    selection.value.condition = SelectorCondition.And;
  }
});

const manuallySelectedText = computed(() =>
  t(
    'manually_selected_entity',
    {
      entityName: entityName.value,
      count: selection.value.ids?.length ?? 0,
    },
    selection.value.ids?.length ?? 0,
  ),
);
const showAllProductsTag = computed(
  () =>
    (!selection.value.categoryIds?.length &&
      (selection.value.brandIds?.length ||
        selection.value.price?.length ||
        selection.value.stock?.length)) ||
    allEmpty.value,
);
const allEmpty = computed(
  () =>
    activeConditionTypes.value === 0 &&
    (!selection.value.ids || !selection.value.ids.length),
);

// TODO: Move this to utils/composable? -----
function getCurrencyValue(field: CurrencyField, displayCurrency = true) {
  const currCurr = currentCurrency.value || 'SEK';
  const currency = displayCurrency ? ' ' + currCurr : '';
  return field && field[currCurr]
    ? formatCurrencyNumber(field[currCurr]) + currency
    : t('not_set');
}
function formatCurrencyNumber(value: number | string) {
  if (value === null || value === '') return '';
  const options =
    Number.isInteger(value) || value === 0
      ? {}
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat(navigator?.language || 'sv-SE', options).format(
    Number(value),
  );
}

const userUnderstandableOperators: { [key in CompareCondition]: string } = {
  lt: t('less_than'),
  gt: t('more_than'),
  eq: t('exactly'),
};
function getUnderstandableOperator(operator: CompareCondition) {
  return userUnderstandableOperators[operator];
}
// ------------------------ //

const getPriceTagText = (price: PriceSelection) => {
  return `${getUnderstandableOperator(price.condition)} ${getCurrencyValue(price.values)}`;
};

const getLinkingWord = (option: 'brand' | 'price' | 'stock') => {
  const condition = selection.value.condition;
  return t(`selector_${option}_linking_word_${condition}`);
};

const updateSelection = (updatedSelection: SelectorSelectionInternal) => {
  selection.value = updatedSelection;
};

const noSelectionLabel = computed(() => {
  return (type.value === SelectorSelectionType.Include &&
    selectionStrategy.value === SelectorSelectionStrategy.All) ||
    activeConditionTypes.value > 0
    ? t('all_entity', { entityName: entityName.value }, 2)
    : t('no_entity', { entityName: entityName.value }, 2);
});
</script>

<template>
  <div>
    <ContentHeading>
      {{
        type === SelectorSelectionType.Include ? $t('select') : $t('exclude')
      }}
    </ContentHeading>
    <div class="relative rounded-lg border px-3 py-4">
      <SelectorPanel
        :selection="selection"
        :mode="mode"
        :currency="currentCurrency"
        :entity-name="entityName"
        :entities="entities"
        :options="selectorOptions"
        @save="updateSelection"
      >
        <Button class="absolute top-3.5 right-3">{{ $t('browse') }}</Button>
      </SelectorPanel>
      <div class="flex w-[calc(100%-5.5rem)] flex-col gap-3">
        <!-- All / No products tag -->
        <SelectorTags
          v-if="
            showAllProductsTag && selection.condition !== SelectorCondition.Or
          "
        >
          <SelectorTag :label="noSelectionLabel" :removable="false" />
        </SelectorTags>

        <!-- Categories -->
        <SelectorTags v-if="selection.categoryIds?.length">
          <SelectorTagLink
            v-for="(id, index) in selection.categoryIds"
            :key="index"
            :linking-word="$t('or')"
            :is-last="index === selection.categoryIds.length - 1"
          >
            <SelectorTag
              :label="getCategoryName(id)"
              @remove="selection.categoryIds?.splice(index, 1)"
            />
          </SelectorTagLink>
        </SelectorTags>

        <!-- Brands -->
        <SelectorLinkingWord v-if="selection.brandIds?.length">
          {{ getLinkingWord('brand') }}
        </SelectorLinkingWord>
        <SelectorTags v-if="selection.brandIds?.length">
          <SelectorTagLink
            v-for="(id, index) in selection.brandIds"
            :key="index"
            :linking-word="$t('or')"
            :is-last="index === selection.brandIds.length - 1"
          >
            <SelectorTag
              :label="getBrandName(id)"
              @remove="selection.brandIds?.splice(index, 1)"
            />
          </SelectorTagLink>
        </SelectorTags>

        <!-- Price -->
        <SelectorLinkingWord v-if="selection.price?.length">
          {{ getLinkingWord('price') }}
        </SelectorLinkingWord>
        <SelectorTags v-if="selection.price?.length">
          <SelectorTagLink
            v-for="(price, index) in selection.price"
            :key="index"
            :linking-word="$t('and')"
            :is-last="index === selection.price.length - 1"
          >
            <SelectorTag
              :label="getPriceTagText(price)"
              @remove="selection.price?.splice(index, 1)"
            />
          </SelectorTagLink>
        </SelectorTags>

        <!-- Stock -->
        <SelectorLinkingWord v-if="selection.stock?.length">
          {{ getLinkingWord('stock') }}
        </SelectorLinkingWord>
        <SelectorTags v-if="selection.stock?.length">
          <SelectorTagLink
            v-for="(stock, index) in selection.stock"
            :key="index"
            :linking-word="$t('and')"
            :is-last="index === selection.stock.length - 1"
          >
            <SelectorTag
              :label="`${getUnderstandableOperator(stock.condition)} ${stock.quantity}`"
              @remove="selection.stock?.splice(index, 1)"
            />
          </SelectorTagLink>
        </SelectorTags>

        <!-- Products -->
        <SelectorLinkingWord
          v-if="selection.ids?.length && activeConditionTypes > 0"
        >
          {{ $t('selector_ids_linking_word') }}
        </SelectorLinkingWord>
        <SelectorTags v-if="selection.ids?.length">
          <SelectorTag
            :label="manuallySelectedText"
            @remove="selection.ids = []"
          />
        </SelectorTags>
      </div>
      <!-- Footer -->
      <div
        v-if="activeConditionTypes > 1"
        class="mt-4 items-center gap-5 border-t pt-4 text-sm @2xl:flex"
      >
        <div class="mb-2 @2xl:mb-0">
          {{ $t('select_entity_that_match', { entityName }, 2) }}
        </div>
        <RadioGroup
          v-model="selection.condition"
          default-value="and"
          class="items-center gap-2 @2xl:flex @2xl:gap-4"
        >
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="and" value="and" />
            <Label for="and">{{ $t('selector_condition_choice_and') }}</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="or" value="or" />
            <Label for="or">{{ $t('selector_condition_choice_or') }}</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  </div>
</template>
