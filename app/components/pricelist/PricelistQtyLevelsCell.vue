<script setup lang="ts">
const _props = defineProps<{
  quantityLevels: PricelistRule[];
}>();
console.log('🚀 ~ _props:', _props.quantityLevels);
</script>
<template>
  <div class="w-[40px]">
    <div class="flex items-center justify-center">
      <ContentTextTooltip>
        {{ quantityLevels.length }}
        <template #tooltip>
          <div>
            <table>
              <thead>
                <tr>
                  <th>{{ $t('quantity') }}</th>
                  <th>{{ $t('price') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rule, index) in quantityLevels" :key="index">
                  <td>{{ rule.quantity }}</td>
                  <td>{{ rule.price }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </ContentTextTooltip>
    </div>
  </div>
</template>
