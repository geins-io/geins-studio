<script setup lang="ts">
import type { PricelistRule } from '#shared/types';
const props = defineProps<{ rule: PricelistRule }>();

const rule = reactive<PricelistRule>(props.rule);
</script>
<template>
  <tr>
    <td>
      <Input v-model="rule.quantity" size="sm" />
    </td>
    <td>
      <Input v-model="rule.margin" size="sm">
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td>
      <Input v-model="rule.discountPercent" size="sm">
        <template #valueDescriptor>%</template>
      </Input>
    </td>
    <td class="flex items-center gap-2">
      <Button size="sm">Apply</Button>
      <Button size="sm" variant="outline">Apply and overwrite</Button>
      <Button size="sm" variant="destructive">Remove</Button>
    </td>
  </tr>
</template>
