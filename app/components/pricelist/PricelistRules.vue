<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
  mode: 'margin' | 'discount' | 'all';
  currency?: string;
  disabled?: boolean;
  vatDescription?: string;
  showLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'apply' | 'apply-overwrite' | 'remove', rule: PricelistRule): void;
  (e: 'update', rules: PricelistRule[]): void;
  (e: 'update-rule', payload: { index: number; rule: PricelistRule }): void;
}>();

const rules = toRef(props, 'rules');
const loading = defineModel<boolean>('loading');
const loadingIndex = ref<number | null>(null);

// Flag to prevent emitting updates when syncing from props
const syncingFromProps = ref(false);

const localRules = ref<PricelistRule[]>(
  rules.value.map((rule) => ({ ...rule, applied: true })),
);

// Computed property to filter out rules with quantity 1 for display
const visibleRules = ref<PricelistRule[]>(
  localRules.value.filter((rule) => !(rule.quantity === 1 && rule.applied)),
);

watch(
  localRules,
  (newRules: PricelistRule[]) => {
    visibleRules.value = newRules.filter(
      (rule) => !(rule.quantity === 1 && rule.applied),
    );
    if (!syncingFromProps.value) {
      emit('update', newRules);
    }
  },
  { deep: true },
);

watch(rules, (newRules) => {
  syncingFromProps.value = true;
  localRules.value = newRules.map((rule) => ({ ...rule, applied: true }));
  nextTick(() => {
    syncingFromProps.value = false;
  });
});

const emptyRule: PricelistRule = {
  quantity: undefined,
  margin: undefined,
  discountPercent: undefined,
  price: undefined,
  applied: false,
  global: false,
  lastFieldChanged: 'price',
};

const addRule = () => {
  localRules.value.push({ ...emptyRule });
};

const apply = (
  index: number,
  rule: PricelistRule,
  overwrite: boolean,
): void => {
  loadingIndex.value = index;
  // Find the corresponding rule in localRules and update it
  const localRuleIndex = localRules.value.findIndex((r) => r === rule);
  if (localRuleIndex !== -1) {
    const localRule = localRules.value[localRuleIndex];
    if (localRule) {
      localRule.applied = true;
    }
  }
  nextTick(() => {
    if (overwrite) {
      emit('apply-overwrite', rule);
    } else {
      emit('apply', rule);
    }
  });
};

const handleUpdate = (
  index: number,
  rule: PricelistRule,
  field: PricelistRuleField,
): void => {
  rule.lastFieldChanged = field;
  loadingIndex.value = index;
  if (props.showLoading) {
    loading.value = true;
  }
  emit('update-rule', { index, rule });
};

const remove = (rule: PricelistRule): void => {
  if (!rule.applied) {
    const ruleIndex = localRules.value.findIndex(
      (r) =>
        r.quantity === rule.quantity &&
        r.discountPercent === rule.discountPercent &&
        r.margin === rule.margin &&
        r.price === rule.price,
    );
    localRules.value = localRules.value.filter((_, i) => i !== ruleIndex);
    return;
  }
  emit('remove', rule);
};

const thClasses = 'text-xs font-bold text-left py-2';
</script>
<template>
  <div class="w-full table-auto">
    <table class="w-full table-auto">
      <thead v-if="visibleRules.length">
        <tr>
          <th :class="thClasses">{{ $t('quantity') }}</th>
          <th v-if="mode === 'margin' || mode === 'all'" :class="thClasses">
            {{ $t('margin') }}
          </th>
          <th v-if="mode === 'discount' || mode === 'all'" :class="thClasses">
            {{ $t('discount') }}
          </th>
          <th v-if="mode === 'all'" :class="thClasses">
            {{ $t('wholesale.pricelist_price') }} ({{ props.vatDescription }})
          </th>
          <th v-else :class="thClasses">
            {{ $t('wholesale.pricelist_applied') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <PricelistRule
          v-for="(rule, index) in visibleRules"
          :key="index"
          v-model:quantity="rule.quantity"
          v-model:margin="rule.margin"
          v-model:discount="rule.discountPercent"
          v-model:applied="rule.applied"
          v-model:price="rule.price"
          :mode="mode"
          :index="index"
          :global="rule.global"
          :currency="currency"
          :loading="loading && loadingIndex === index"
          :last-field-changed="rule.lastFieldChanged"
          @update:margin="handleUpdate(index, rule, 'margin')"
          @update:discount="handleUpdate(index, rule, 'discountPercent')"
          @update:price="handleUpdate(index, rule, 'price')"
          @apply="apply(index, rule, false)"
          @apply-overwrite="apply(index, rule, true)"
          @remove="remove(rule)"
        />
      </tbody>
    </table>
    <Button
      v-if="!disabled"
      size="sm"
      variant="link"
      :class="cn('flex', visibleRules.length ? 'mt-2' : '')"
      @click="addRule"
    >
      <LucidePlus class="mr-2 size-3.5" />
      {{ $t('wholesale.pricelist_add_level') }}
    </Button>
  </div>
</template>
