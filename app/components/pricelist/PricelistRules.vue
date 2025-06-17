<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
  mode: 'margin' | 'discount';
}>();

const emit = defineEmits<{
  (e: 'update', rules: PricelistRule[]): void;
}>();

const rules = ref<PricelistRule[]>(props.rules);

const emptyRule: PricelistRule = {
  quantity: 1,
  margin: undefined,
  discountPercent: undefined,
  applied: false,
};

const addRule = () => {
  rules.value.push({ ...emptyRule });
};

if (rules.value.length === 0) {
  addRule();
}

watch(
  rules,
  (newRules) => {
    const appliedRules = newRules
      .filter((rule) => rule.applied)
      .map((rule) => ({
        quantity: rule.quantity,
        margin: rule.margin,
        discountPercent: rule.discountPercent,
      }));
    emit('update', appliedRules);
  },
  { deep: true },
);

const thClasses = 'text-xs font-bold text-left py-2';
</script>
<template>
  <table class="w-full table-auto">
    <thead v-if="rules.length">
      <tr>
        <th :class="thClasses">Quantity</th>
        <th v-if="mode === 'margin'" :class="thClasses">Margin</th>
        <th v-if="mode === 'discount'" :class="thClasses">Discount</th>
        <th :class="thClasses">Applied</th>
      </tr>
    </thead>
    <tbody>
      <PricelistRule
        v-for="(rule, index) in rules"
        :key="index"
        v-model:quantity="rule.quantity"
        v-model:margin="rule.margin"
        v-model:discount="rule.discountPercent"
        v-model:applied="rule.applied"
        :mode="mode"
        @apply="rule.applied = true"
        @apply-and-overwrite="rule.applied = true"
        @remove="rules.splice(index, 1)"
      />
      <tr>
        <td colspan="5" class="pt-2">
          <Button size="sm" variant="link" class="flex" @click="addRule">
            <LucidePlus class="mr-2 size-3.5" />
            Add price rule
          </Button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
