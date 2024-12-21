<script setup lang="ts">
const props = defineProps<{
  checked: boolean;
}>();

const value = ref(props.checked);

const emit = defineEmits<{
  (event: 'update:checked', value: boolean): void;
}>();

watch(value, (newValue) => {
  emit('update:checked', newValue);
});
</script>
<template>
  <div
    class="flex flex-row items-center justify-between rounded-lg border p-4 text-sm"
  >
    <div class="space-y-0.5">
      <p class="font-semibold">Exclude products from selection</p>
      <p>Exclude a brand, category, product etc. from your selection</p>
    </div>
    <div>
      <Switch v-model:checked="value" />
    </div>
  </div>
</template>
