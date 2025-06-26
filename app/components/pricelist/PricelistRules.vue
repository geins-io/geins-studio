<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
  mode: 'margin' | 'discount' | 'price';
  currency?: string;
}>();

const emit = defineEmits<{
  (e: 'update', rules: PricelistRule[]): void;
}>();

const appliedRules = props.rules.map((rule) => ({
  ...rule,
  applied: true,
}));

const localRules = ref<PricelistRule[]>(appliedRules);

const emptyRule: PricelistRule = {
  quantity: 1,
  margin: undefined,
  discountPercent: undefined,
  price: undefined,
  applied: props.mode === 'price' ? true : false,
  global: false,
};

const addRule = () => {
  localRules.value.push({ ...emptyRule });
};

if (localRules.value.length === 0) {
  addRule();
} else if (
  !localRules.value.some((rule) => rule.quantity === 1) &&
  props.mode !== 'price'
) {
  localRules.value.unshift({ ...emptyRule });
}

watch(
  localRules,
  (newRules) => {
    const appliedRules = newRules
      .filter((rule) => props.mode === 'price' || rule.applied)
      .map((rule) => ({
        quantity: rule.quantity,
        margin: props.mode === 'margin' ? rule.margin : 0,
        discountPercent: props.mode === 'discount' ? rule.discountPercent : 0,
        price: props.mode === 'price' ? rule.price : undefined,
      }));

    emit('update', appliedRules);
  },
  { deep: true },
);

const thClasses = 'text-xs font-bold text-left py-2';
</script>
<template>
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
        @apply="rule.applied = true"
        @apply-and-overwrite="rule.applied = true"
        @remove="localRules.splice(index, 1)"
      />
      <tr>
        <td colspan="5" class="pt-2">
          <Button size="sm" variant="link" class="flex" @click="addRule">
            <LucidePlus class="mr-2 size-3.5" />
            {{ $t('wholesale.pricelist_add_rule') }}
          </Button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
