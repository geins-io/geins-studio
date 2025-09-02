<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
  mode: 'margin' | 'discount' | 'all';
  currency?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'apply', rules: PricelistRule[]): void;
  (
    e: 'apply-overwrite',
    payload: { rule: PricelistRule; rules: PricelistRule[] },
  ): void;
  (e: 'update', rules: PricelistRule[]): void;
}>();

const rules = toRef(props, 'rules');

const localRules = ref<PricelistRule[]>(
  rules.value.map((rule) => ({
    ...rule,
    applied: true,
  })),
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

    emit('update', newRules);
  },
  { deep: true },
);

// replace localRules if rules are removed
watch(rules, (newRules) => {
  if (
    newRules.length === 0 ||
    (newRules.length === 1 && newRules[0]?.quantity === 1)
  ) {
    localRules.value = newRules.map((rule) => ({ ...rule, applied: true }));
  }
});

const emptyRule: PricelistRule = {
  quantity: undefined,
  margin: undefined,
  discountPercent: undefined,
  price: undefined,
  applied: false,
  global: false,
  lastFieldChanged: 'margin',
};

const addRule = () => {
  localRules.value.push({ ...emptyRule });
};

const getAppliedRules = (): PricelistRule[] => {
  const rules = localRules.value
    .filter((rule) => props.mode === 'all' || rule.applied)
    .map((rule) => ({
      quantity: rule.quantity,
      margin: props.mode === 'margin' ? rule.margin : 0,
      discountPercent: props.mode === 'discount' ? rule.discountPercent : 0,
      price: props.mode === 'all' ? rule.price : 0,
    }));
  return rules;
};

const apply = (index: number, overwrite: boolean): void => {
  const rule = visibleRules.value[index];
  if (rule) {
    // Find the corresponding rule in localRules and update it
    const localRuleIndex = localRules.value.findIndex((r) => r === rule);
    if (localRuleIndex !== -1) {
      const localRule = localRules.value[localRuleIndex];
      if (localRule) {
        localRule.applied = true;
      }
    }

    const appliedRules = getAppliedRules();
    nextTick(() => {
      if (overwrite) {
        emit('apply-overwrite', { rule, rules: appliedRules });
      } else {
        emit('apply', appliedRules);
      }
    });
  }
};

const remove = (index: number): void => {
  const rule = visibleRules.value[index];
  if (rule) {
    // Find and remove the corresponding rule from localRules
    const localRuleIndex = localRules.value.findIndex((r) => r === rule);
    if (localRuleIndex !== -1) {
      localRules.value.splice(localRuleIndex, 1);
    }
  }
  const appliedRules = getAppliedRules();
  nextTick(() => {
    emit('apply', appliedRules);
  });
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
            {{ $t('wholesale.pricelist_margin') }}
          </th>
          <th v-if="mode === 'discount' || mode === 'all'" :class="thClasses">
            {{ $t('wholesale.pricelist_discount') }}
          </th>
          <th v-if="mode === 'all'" :class="thClasses">
            {{ $t('wholesale.pricelist_price') }}
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
          v-model:global="rule.global"
          :mode="mode"
          :index="index"
          :currency="currency"
          @update:margin="rule.lastFieldChanged = 'margin'"
          @update:discount="rule.lastFieldChanged = 'discountPercent'"
          @update:price="rule.lastFieldChanged = 'price'"
          @apply="apply(index, false)"
          @apply-and-overwrite="apply(index, true)"
          @remove="remove(index)"
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
