<script setup lang="ts">
const props = defineProps<{
  rules: PricelistRule[];
}>();

const rules = ref<PricelistRule[]>(props.rules);

const emptyRule: PricelistRule = {
  quantity: 0,
  margin: 0,
  discountPercent: 0,
};

const addRule = () => {
  rules.value.push({ ...emptyRule });
};
</script>
<template>
  <table>
    <thead v-if="rules.length">
      <tr>
        <th>Quantity</th>
        <th>Margin</th>
        <th>Discount %</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <PricelistRule v-for="(rule, index) in rules" :key="index" :rule="rule" />
      <tr>
        <td colspan="4">
          <Button size="sm" variant="link" class="flex" @click="addRule">
            <LucidePlus class="mr-2" />
            Add price rule
          </Button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
