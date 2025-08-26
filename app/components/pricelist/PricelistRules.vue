<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
  mode: 'margin' | 'discount' | 'price';
  currency?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'apply', rules: PricelistRule[]): void;
  (e: 'apply-overwrite', rule: PricelistRule): void;
}>();

const rules = toRef(props, 'rules');

// Function to deduplicate rules by quantity (keep the last occurrence)
const deduplicateRules = (rules: PricelistRule[]): PricelistRule[] => {
  const seenQuantities = new Map<number, PricelistRule>();
  rules.forEach((rule) => {
    if (rule.quantity !== undefined && rule.quantity > 1) {
      seenQuantities.set(rule.quantity, rule);
    }
  });
  return Array.from(seenQuantities.values()).sort(
    (a, b) => (a.quantity || 0) - (b.quantity || 0),
  );
};

const appliedRules = ref<PricelistRule[]>([]);
const localRules = ref<PricelistRule[]>(
  deduplicateRules(
    rules.value.map((rule) => ({
      ...rule,
      applied: true,
    })),
  ),
);

watch(rules, (newRules) => {
  if (newRules.length === 0) {
    localRules.value = [];
    appliedRules.value = [];
    return;
  }
});

const emptyRule: PricelistRule = {
  quantity: undefined,
  margin: undefined,
  discountPercent: undefined,
  price: undefined,
  applied: props.mode === 'price' ? true : false,
  global: false,
};

const addRule = () => {
  localRules.value.push({ ...emptyRule });
};

watch(
  localRules,
  (newRules) => {
    // Deduplicate rules and filter out quantity 1 and undefined
    const deduplicatedRules = deduplicateRules(newRules);

    const rules = deduplicatedRules
      .filter((rule) => props.mode === 'price' || rule.applied)
      .map((rule) => ({
        quantity: rule.quantity,
        margin: props.mode === 'margin' ? rule.margin : 0,
        discountPercent: props.mode === 'discount' ? rule.discountPercent : 0,
        price: props.mode === 'price' ? rule.price : 0,
      }));
    appliedRules.value = rules;
  },
  { deep: true },
);

const apply = (index: number): void => {
  const rule = localRules.value[index];
  if (rule) {
    rule.applied = true;
  }
  nextTick(() => {
    emit('apply', appliedRules.value);
  });
};

const applyAndOverwrite = (index: number): void => {
  const rule = localRules.value[index];
  if (rule) {
    rule.applied = true;
    nextTick(() => {
      emit('apply', appliedRules.value);
      emit('apply-overwrite', rule);
    });
  }
};

const remove = (index: number): void => {
  localRules.value.splice(index, 1);
  nextTick(() => {
    emit('apply', appliedRules.value);
  });
};

const thClasses = 'text-xs font-bold text-left py-2';
</script>
<template>
  <div class="w-full table-auto">
    <table class="w-full table-auto">
      <thead v-if="localRules.length">
        <tr>
          <th :class="thClasses">{{ $t('quantity') }}</th>
          <th v-if="mode === 'margin'" :class="thClasses">
            {{ $t('wholesale.pricelist_margin') }}
          </th>
          <th v-if="mode === 'discount'" :class="thClasses">
            {{ $t('wholesale.pricelist_discount') }}
          </th>
          <th v-if="mode === 'price'" :class="thClasses">
            {{ $t('wholesale.pricelist_price') }}
          </th>
          <th v-else :class="thClasses">
            {{ $t('wholesale.pricelist_applied') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <PricelistRule
          v-for="(rule, index) in localRules"
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
          @apply="apply(index)"
          @apply-and-overwrite="applyAndOverwrite(index)"
          @remove="remove(index)"
        />
      </tbody>
    </table>
    <Button
      v-if="!disabled"
      size="sm"
      variant="link"
      :class="cn('flex', localRules.length ? 'mt-2' : '')"
      @click="addRule"
    >
      <LucidePlus class="mr-2 size-3.5" />
      {{ $t('wholesale.pricelist_add_level') }}
    </Button>
  </div>
</template>
