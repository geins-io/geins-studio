<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    currency?: string;
    emptyText?: string;
    emptyDesc?: string;
    footerText?: string;
    type: 'include' | 'exclude';
  }>(),
  {
    emptyText: 'All products',
    emptyDesc: 'No conditions set',
    footerText: 'Include products that match:',
    type: 'include',
  },
);

const currentCurrency = ref(props.currency);
const selection = ref(props.selection);

const removeCategory = (index: number) => {
  selection.value.categories?.splice(index, 1);
};

const activeConditionTypes = computed(() => {
  let active = 0;
  Object.keys(props.selection).forEach((key) => {
    if (
      key !== 'condition' &&
      key !== 'ids' &&
      selection.value[key as keyof SelectorSelection]?.length
    ) {
      active++;
    }
  });
  return active;
});

const brandLinkingWord = computed(() =>
  props.selection.condition === 'or' ? 'AND ALL PRODUCTS FROM' : 'FROM',
);

const priceLinkingWord = computed(() =>
  props.selection.condition === 'or'
    ? 'AND ALL PRODUCTS THAT COSTS'
    : 'THAT COSTS',
);

const stockLinkingWord = computed(() =>
  props.selection.condition === 'or'
    ? 'AND ALL PRODUCTS WHERE STOCK IS'
    : 'WHERE STOCK IS',
);

const manuallySelectedText = computed(
  () => `Manually selected products (${props.selection.ids?.length ?? 0})`,
);

const showAllProductsTag = computed(
  () =>
    (props.selection.categories?.length === 0 &&
      (props.selection.brands?.length ||
        props.selection.price?.length ||
        props.selection.stock?.length)) ||
    allEmpty.value,
);

const allEmpty = computed(
  () =>
    activeConditionTypes.value === 0 &&
    (!props.selection.ids || !props.selection.ids.length),
);

function getCurrencyValue(field: CurrencyField, displayCurrency = true) {
  const currCurr = currentCurrency.value || 'SEK';
  const currency = displayCurrency ? ' ' + currCurr : '';
  return field && field[currCurr]
    ? formatCurrencyNumber(field[currCurr]) + currency
    : 'Not set';
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

const userUnderstandableOperators = {
  lt: 'Less than',
  gt: 'More than',
  eq: 'Exactly',
};

function getUnderstandableOperator(operator: CompareCondition) {
  return userUnderstandableOperators[operator];
}

function getPriceTagText(price: PriceSelection) {
  return `${getUnderstandableOperator(price.condition)} ${getCurrencyValue(price.values)}`;
}

watch(activeConditionTypes, (newVal) => {
  if (newVal <= 1) {
    selection.value.condition = 'and';
  }
});

watch(
  () => props.currency,
  (newVal) => {
    currentCurrency.value = newVal;
  },
);
</script>

<template>
  <div>
    <h3 class="mb-1 text-sm font-medium">
      {{ type === 'include' ? 'Select' : 'Exclude' }}
    </h3>
    <div class="flex flex-col gap-3 rounded-lg border px-3 py-4">
      <!-- All / No products tag -->
      <SelectorTags v-if="showAllProductsTag && selection.condition === 'and'">
        <SelectorTag
          :label="`${type === 'include' ? 'All products' : 'No products'}`"
          :removable="false"
        />
      </SelectorTags>

      <!-- Categories -->
      <SelectorTags v-if="selection.categories?.length">
        <SelectorTagLink
          v-for="(item, index) in selection.categories"
          :key="index"
          linking-word="OR"
          :is-last="index === selection.categories.length - 1"
        >
          <SelectorTag :label="item.name" @remove="removeCategory(index)" />
        </SelectorTagLink>
      </SelectorTags>

      <!-- Brands -->
      <SelectorLinkingWord v-if="selection.brands?.length">
        {{ brandLinkingWord }}
      </SelectorLinkingWord>
      <SelectorTags v-if="selection.brands?.length">
        <SelectorTagLink
          v-for="(item, index) in selection.brands"
          :key="index"
          linking-word="OR"
          :is-last="index === selection.brands.length - 1"
        >
          <SelectorTag
            :label="item.name"
            @remove="selection.brands?.splice(index, 1)"
          />
        </SelectorTagLink>
      </SelectorTags>

      <!-- Price -->
      <SelectorLinkingWord v-if="selection.price?.length">
        {{ priceLinkingWord }}
      </SelectorLinkingWord>
      <SelectorTags v-if="selection.price?.length">
        <SelectorTagLink
          v-for="(price, index) in selection.price"
          :key="index"
          linking-word="AND"
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
        {{ stockLinkingWord }}
      </SelectorLinkingWord>
      <SelectorTags v-if="selection.stock?.length">
        <SelectorTagLink
          v-for="(stock, index) in selection.stock"
          :key="index"
          linking-word="AND"
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
        AND ALSO
      </SelectorLinkingWord>
      <SelectorTags v-if="selection.ids?.length">
        <SelectorTag
          :label="manuallySelectedText"
          @remove="selection.ids = []"
        />
      </SelectorTags>

      <!-- Footer -->
      <div
        v-if="activeConditionTypes > 1"
        class="mt-1 flex items-center gap-5 border-t pt-4 text-sm"
      >
        <div>{{ footerText }}</div>
        <RadioGroup
          v-model="selection.condition"
          default-value="and"
          class="flex items-center gap-4"
        >
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="and" value="and" />
            <Label for="and">All conditions above</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem id="or" value="or" />
            <Label for="or">Any condition above</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  </div>
</template>
