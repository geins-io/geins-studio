<script setup lang="ts">
const { defaultCurrency } = useAccountStore();

interface Selection {
  categories: Array<{ name: string }>;
  brands: Array<{ name: string }>;
  price: Array<{ condition: string; prices: number[] }>;
  ids: Array<string>;
  condition: 'and' | 'or';
}

const props = withDefaults(
  defineProps<{
    selection: Selection;
    currency: string;
    emptyText?: string;
    emptyDesc: string;
    footerText: string;
  }>(),
  {
    currency: defaultCurrency,
  },
);

const currentCurrency = ref(props.currency);

const activeConditionTypes = computed(() => {
  let active = 0;
  Object.keys(props.selection).forEach((key) => {
    if (
      key !== 'condition' &&
      key !== 'products' &&
      props.selection[key]?.length
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
    ? 'AND ALL PRODUCTS THAT COST'
    : 'THAT COST',
);

const manuallySelectedText = computed(
  () => `Manually selected products (${props.selection.products?.length ?? 0})`,
);

const showAllProductsTag = computed(
  () =>
    props.selection.categories?.length === 0 &&
    (props.selection.brands?.length || props.selection.price?.length),
);

const allEmpty = computed(
  () =>
    activeConditionTypes.value === 0 &&
    (!props.selection.products || !props.selection.products.length),
);

function getPriceTagText(price: { condition: string; prices: number[] }) {
  return `${getUnderstandableOperator(price.condition)} ${getCurrencyValue(price.prices)}`;
}

watch(activeConditionTypes, (newVal) => {
  if (newVal <= 1) {
    props.selection.condition = 'and';
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
    <!-- Categories -->
    <div v-if="selection.categories && selection.categories.length">
      <div v-for="(category, index) in selection.categories" :key="index">
        <CarismarTag
          :text="category.name"
          @remove="selection.categories.splice(index, 1)"
        />
        <span v-if="selection.categories.length !== index + 1">OR</span>
      </div>
    </div>

    <!-- All Products -->
    <div v-else-if="showAllProductsTag && selection.condition === 'and'">
      <CarismarTag text="All products" :removable="false" />
    </div>

    <!-- Empty -->
    <div v-else-if="allEmpty">
      <CarismarTag :text="emptyText || 'All products'" :removable="false" />
      <p>{{ emptyDesc }}</p>
    </div>

    <!-- Brands -->
    <div v-if="selection.brands && selection.brands.length">
      <span>{{ brandLinkingWord }}</span>
      <div>
        <div v-for="(brand, index) in selection.brands" :key="index">
          <CarismarTag
            :text="brand.name"
            @remove="selection.brands.splice(index, 1)"
          />
          <span v-if="selection.brands.length !== index + 1">OR</span>
        </div>
      </div>
    </div>

    <!-- Price -->
    <div v-if="selection.price && selection.price.length">
      <span>{{ priceLinkingWord }}</span>
      <div>
        <div v-for="(price, index) in selection.price" :key="index">
          <CarismarTag
            :text="getPriceTagText(price)"
            @remove="selection.price.splice(index, 1)"
          />
          <span v-if="selection.price.length !== index + 1">AND</span>
        </div>
      </div>
    </div>

    <!-- Products -->
    <div
      v-if="
        selection.products &&
        selection.products.length &&
        activeConditionTypes > 0
      "
    >
      <span>ALSO</span>
    </div>
    <div v-if="selection.products && selection.products.length">
      <div>
        <CarismarTag
          :text="manuallySelectedText"
          @remove="selection.products = []"
        />
      </div>
    </div>

    <!-- Footer -->
    <div v-if="activeConditionTypes > 1">
      <div>{{ footerText }}</div>
      <div>
        <CarismarInputRadio
          label="All conditions above"
          value="and"
          v-model="selection.condition"
        />
        <CarismarInputRadio
          label="Any condition above"
          value="or"
          v-model="selection.condition"
        />
      </div>
    </div>
  </div>
</template>
