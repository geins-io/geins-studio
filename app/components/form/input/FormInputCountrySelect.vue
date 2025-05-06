<script setup lang="ts">
const model = defineModel<string>();

const countryCode = ref<string>(model.value || '');
watch(countryCode, (val) => {
  if (val === model.value) {
    return;
  }
  model.value = val;
});

watch(model, (val) => {
  if (countryCode.value === val) {
    return;
  }
  countryCode.value = val || '';
});

const accountStore = useAccountStore();
const { currentCountries } = storeToRefs(accountStore);

const countries = computed<PlainDataItem[]>(() => {
  return currentCountries.value.map((country) => ({
    label: country?.name || '',
    value: country?._id || '',
  }));
});
</script>

<template>
  <FormInputSelectSearch
    v-model="countryCode"
    :data-set="countries"
    entity-name="country"
  />
</template>
